/* FlexFX */

/**
 * Tools for creating composite sound-effects of class FlexFX that can be performed 
 * (either directly or queued-up) as defined; or with scaled pitch, volume or duration.
 */

//% color=#7c68b4
//% icon="\uf0a1"
//% block="FlexFX"
//% groups="['micro:bit(V2) Playing', 'micro:bit(V2) Play-list', 'micro:bit(V2) Creating']"
namespace flexFX {  
    // Simplify the selection of wave-shape...
    export enum Wave {
        //%block="silence"
        Silence = -1,    // (special case for queueing silent gaps onto the Play-list) 
        //%block="pure"
        Sine = WaveShape.Sine,
        //%block="buzzy"
        Square = WaveShape.Square,
        //%block="bright"
        Triangle = WaveShape.Triangle,
        //%block="harsh"
        Sawtooth = WaveShape.Sawtooth,
        //%block="nNoisy"
        Noise = WaveShape.Noise
    }
    // Simplify the selection of frequency interpolation trajectory...
    export enum Attack {
        //% block="fast"
        Fast = InterpolationCurve.Logarithmic,
        //% block="medium"
        Medium = InterpolationCurve.Curve,
        //% block="even"
        Even = InterpolationCurve.Linear,
        //% block="delayed"   *** option temporarily removed...
        // Delayed = 99 later, mapped to Sine or Cosine, depending on slope of profile
    }
    // Simplify (slightly) the selection of modulation-style...
    export enum Effect {
        //% block="none"
        None = SoundExpressionEffect.None,
        //% block="vibrato"
        Vibrato = SoundExpressionEffect.Vibrato,
        //% block="tremolo"
        Tremolo = SoundExpressionEffect.Tremolo,
        //% block="warble"
        Warble = SoundExpressionEffect.Warble
    }

    // drop-down selection of built-in FlexFXs
    export enum BuiltInFlexFX {
        //% block="chime"
        Chime,
        //% block="cry"
        Cry,
        //% block="flute"
        Flute,
        //% block="horn"
        Horn,
        //% block="hum"
        Hum,

        //% block="laugh"
        Laugh,
        //% block="miaow"
        Miaow,
        //% block="moan"
        Moan,
        //% block="moo"
        Moo,
        //% block="motor"
        Motor,

        //% block="query"
        Query,
        //% block="shout"
        Shout,
        //% block="siren"
        Siren,
        //% block="snore"
        Snore,
        //% block="ting"
        Ting,

        //% block="tweet"
        Tweet,
        //% block="uh-oh"
        Uhoh,
        //% block="violin"
        Violin,
        //% block="whale"
        Whale,
        //% block="woof"
        Woof
    }

    //  drop-down selection of built-in Tunes
    export enum BuiltInTune {
        //% block="Happy Birthday To You"
        Birthday,
        //% block="Jingle Bells"
        JingleBells,
        //% block="I'm a Little Teapot"
        TeaPot,
        //% block="If You're Happy and You Know It "
        IfYoureHappy,
        //% block="London Bridge is Burning Down"
        LondonBridge,

        //% block="Old MacDonald Had a Farm"
        OldMacdonald,
        //% block="The Bear Went Over the Mountain"
        BearMountain,
        //% block="Pop Goes the Weasel"
        PopWeasel,
        //% block="This Old Man, He Played One"
        ThisOldMan,
        //% block="She'll be Coming Round the Mountain"
        RoundMountain,

        //% block="Edelweiss"
        Edelweiss,
        //% block="New World Symphony (Dvorak)"
        NewWorld,
        //% block="Ode to Joy (Beethoven)"
        OdeToJoy,
        //% block="Violin Concerto in A Minor (Bach)"
        BachViolin
    }

    // range-clamper:
    function clamp(bottom: number, input: number, top:number): number {
        return (Math.max(bottom,Math.min(input,top)));
    }
    
    // constants used in conversions between frequency & MIDI note-number:
    // a SEMITONE ratio = 12th root of 2 (as 12 semitones make an octave, which doubles the frequency)
    const SEMILOG = 0.057762265047;    // =  Math.log(2) / 12;
    const SEMITONE = 1.0594630943593;  // = Math.exp(SEMILOG) 
    const DELTA = 36.3763165623;       // = (Math.log(440) / SEMILOG) - 69;
 
    // convert a frequency in Hz to its Midi note-number 
    // (retaining microtonal fractions)
    function hertzToMidi(pitch: number): number {
        return ((Math.log(pitch) / SEMILOG) - DELTA);
    }

    // convert a Midi note-number to nearest integer frequency in Hz
    // (based on A4 = 440 Hz = MIDI 69)
    function midiToHertz(midi: number): number {
        return (Math.round(440 * (2 ** ((midi - 69) / 12))));
    }

    // note-lengths in ticks (quarter-beats)
    const QUAVER_TICKS = 2;  
    const CROTCHET_TICKS = 4;
    const MINIM_TICKS = 8;
    const SEMIBREVE_TICKS = 16;

    // for default Tempo of 120 BPM... 
    const DEFAULT_TICKMS = 125; //  = (60*1000) / (4*120)

    // (Basically, a TuneStep is a musical Note, but renamed to avoid confusion with the native "Note")
    class TuneStep {
        ticks: number = -1; // note-extent, measured in quarter-beat "ticks"
        midi: number = -1; // standard MIDI note-number
        pitch: number = 0; // frequency in Hz
        volume: number = 0;  // UI volume [0..255] (gets quadrupled internally)
    
        //debug: string = ""; // saves the EKO source, (just for debug)

        // create using a 3-part EKO-notation specifier: {extent}{key}{octave}
        // (we need to be defensive about parsing malformed EKO strings!)
        constructor(spec: string) {
            //this.debug = spec; // (save our input string for debug purposes)
            let chars = spec.toUpperCase();
            let here = 0;
            let nExtent = this.countDigits(chars, here);
            if (nExtent > 0) {
                this.ticks = Math.min(parseInt(chars.substr(here, nExtent)), 64); // max 16 beats!
                // now parse the Key
                here += nExtent;
                let key = this.parseKey(chars.charCodeAt(here));
                here++;
                // for a silent musical rest: key = 12, and {Octave} is absent
                if ((key > -1) && (key < 12)) { // good Key-letter; not a Rest
                    this.volume = 255; // (as yet, EKO offers no way of adding dynamics)
                    // adjust for accidentals [# or b] ?
                    let nOctave = this.countDigits(chars, here); 
                    if (nOctave == 0) { // no Octave digits found yet
                        let asc = chars.charCodeAt(here); // =the character after Key=letter
                        switch (asc) {
                            case 35: key++; // "#"
                                break;
                            case 66: key--; // "B"
                                break;
                            default: key = -999; // midi will be end up negative!
                        }   
                        here++; 
                        // keep looking for Octave digits
                        nOctave = this.countDigits(chars, here); 
                    }  
                    let octave = -1;
                    if (nOctave > 0) {
                        octave = Math.min(parseInt(chars.substr(here, nOctave)), 10); // quite high enough!
                        // (B10 is 31.6kHz; even young kids' hearing range stops at about 20kHz)
                        // get MIDI from key & octave (careful: MIDI for C0 is 12)
                        this.midi = 12 * (octave + 1) + key;
                        here += nOctave;
                    } else {
                        
                    }
                } // else a bad Key-letter, or a Rest
                if (key ===12) { // for a Rest...
                    this.midi = 0; // ...lack of octave is OK
                }
            } // else a missing Extent

            // check for errors and substitute an alert
            if (   (this.ticks < 0)  // bad Extent?
                || (this.midi < 0)   // bad Key or Octave?
                || (here < chars.length) ) { // spurious extra chars?
                // insert a long high-pitched C8 error-tone
                this.ticks = 16;
                this.midi = 108;
                this.volume = 255;
            }
            this.pitch = midiToHertz(this.midi);

        }

// count consecutive digits in text from start onwards
        countDigits(text: string, start: number): number {
            let i = start;
            while (i < text.length) {
                let asc = text.charCodeAt(i);
                if ((asc < 48) || (asc > 57)) break;
                i++;
            }
            return (i - start);
        }

// parse the key as semitone-in-octave [0 to 11] or 12 for a Rest
        parseKey(asc: number): number {
            let semi = -1;
            if (asc == 82) { // an "R" means a Rest
                semi = 12;
            } else {
                if ((asc > 64) && (asc < 72)) { // ["A" to "G"]
                    // parse Key-letter into semitone [0 to 11]
                    semi = 2 * ((asc - 60) % 7);
                    if (semi > 4) semi--;
                } // else bad Key-letter
            } 
            return (semi);
        }
    }

    class Tune {
        id: string; // identifier
        nNotes: number; // number of notes (steps) in Tune
        nTicks: number; // overall duration of Tune in ticks
        notes: TuneStep[]; // array of notes
        // TODO:For a more nuanced performance, add this per-note volumes array:
        // dynamic: number[]; // ? but how to specify dynamics ?

        // deconstruct the source-string of EKO note-specifiers
        constructor(tuneId: string, source: string) {
            this.id = tuneId;
            this.notes = [];
            this.nTicks = 0;
            let specs = source.trim().split(" ");
            this.nNotes = specs.length;
            for (let i = 0; i < this.nNotes; i++) {
                let nextNote = new TuneStep(specs[i]);
                this.nTicks += nextNote.ticks;
                this.notes.push(nextNote);
            }
        }
        // method to add some more notes...
        extend(source: string) {
            let specs = source.split(" ");
            let count = specs.length;
            for (let i = 0; i < count; i++) {
                let nextNote = new TuneStep(specs[i]);
                this.nNotes ++;
                this.nTicks += nextNote.ticks;
                this.notes.push(nextNote);
            }
        }
    }

   // just a wrapper for the performance...
    class Play {
        parts: SoundExpression[]; // the sound-strings for each of its parts
        constructor() {
            this.parts = [];
        }
    }
   

    // activity events (for other components to synchronise with)
    const FLEXFX_ACTIVITY_ID = 9050 // TODO: Check (somehow?) that this is a permissable value!
    enum PLAYER {
        STARTING = 1,
        FINISHED = 2,
        ALLPLAYED = 3,
    }

/* 
    A FlexFX is a potentially composite sound-effect.
    It can specify several component soundExpressions called "parts" that get played consecutively.
    Each part has a [frequency,volume] start-point and end-point.
    Apart from the first part, the start-point gets inherited from the previous end-point,
    so an n-part FlexFX moves through (n+1) [frequency,volume] points.
    It is built, one part at a time, using defineFlexFX() followed by zero or more extendFlexFX() calls.
*/

    class FlexFX {
        // properties
        id: string; // identifier
        nParts: number;
        prototype: Play; // contains the [nParts] SoundExpressions forming this flexFX
        fullDuration: number; // overall cumulative duration of prototype
        peakVolume: number; // remembers the highest volume [0-1020] in the prototype
        pitchAverage: number; // approximate average pitch (in Hz)
        pitchMidi: number; // midi note-number of average pitch (counted in semitones)
        pitchProfile: number[];  // contains [nParts + 1] scalable frequencies
        volumeProfile: number[];  // contains [nParts + 1] scalable volumes [0-1020]
        durationProfile: number[]; // contains [nParts] scalable durations


        constructor(id: string) {
            this.id = id;
            this.initialise();
        }

        initialise() {
            this.nParts = 0;
            this.prototype = new Play;
            this.fullDuration = 0;
            this.peakVolume = 0;
            this.pitchAverage = 0;
            this.pitchMidi = 0;
            this.pitchProfile = [];
            this.volumeProfile = [];
            this.durationProfile = [];
        }        
        
        // internal tools...

        protected goodPitch(pitch: number): number {
            return Math.min(Math.max(pitch, 1), 9999);
        }
        protected goodVolume(volume: number): number {
            return Math.min(Math.max(volume, 0), 1023);
        }
        protected goodDuration(duration: number): number {
            return Math.min(Math.max(duration, 10), 9999);
        }

        // methods...

        // begin setting up the very first part of a new FlexFX
        startWith(startPitch:number, startVolume: number){
            this.pitchProfile.push(this.goodPitch(startPitch)); // pitchProfile[0]
            let v = this.goodVolume(startVolume*4); // internally, volumes are [0-1020]
            this.volumeProfile.push(v);                         // volumeProfile[0]
            this.peakVolume = v; // ...until proven otherwise
            this.pitchAverage = startPitch;  
        }

        // add the details of the next part (ensuring all parameters are sensible)
        addPart(wave: Wave, attack: Attack, effect: Effect, endPitch: number, endVolume: number, duration: number) {

            this.pitchProfile.push(this.goodPitch(endPitch));
            
            let bigEndVol = this.goodVolume(endVolume*4);
            this.volumeProfile.push(bigEndVol);
            this.peakVolume = Math.max(this.peakVolume, bigEndVol);

            let d = this.goodDuration(duration);
            this.durationProfile.push(d);

            // turn our enums into simple numbers
            let waveNumber: number = wave;
            let effectNumber: number = effect;
            let attackNumber: number = attack;

            // start where the [pitch,volume] last ended:
            // (this.nParts hasn't yet been incremented, so indexes the previous part)
            let startPitch = this.pitchProfile[this.nParts];
            let startVolume = this.volumeProfile[this.nParts]
    
            if (wave == Wave.Silence) {
                // ensure this part plays silently, while preserving the end-point of the previous part 
                // and the start-point of any following part
                startVolume = 0;
                bigEndVol = 0;
                waveNumber = WaveShape.Sine; // arbitrarily, as silent!
            } else {
                // compute average pitch of this part
                let blend = 0;
                switch (attack) {
                    case Attack.Fast: blend = 0.1; // nearly all End pitch
                        break;
                    case Attack.Medium: blend = 0.2; // mostly End pitch
                        break;
                    case Attack.Even: blend = 0.5; // fifty-fifty
                        break;
                //  case Attack.Delayed: blend = 0.8; // mostly Start pitch
                //      break;   *** option temporarily removed...
                }
                let pitch = (blend * startPitch) + ((1-blend) * endPitch);
                // update overall average pitch, weighted by duration of each part
                let kilocycles = (this.pitchAverage*this.fullDuration + pitch*d);
                this.pitchAverage = kilocycles / (this.fullDuration + d);
                // update its MIDI equivalent (including microtonal fractions)
                this.pitchMidi = hertzToMidi(this.pitchAverage);
            }
            this.fullDuration += d; // always add duration, even if silent

            // create the SoundExpression
            let soundExpr = music.createSoundExpression(waveNumber, startPitch, endPitch,
                startVolume, bigEndVol, duration, effectNumber, attackNumber);      
    
            /* FUTURE ENHANCEMENT 
            The underlying implementation in "codal-microbit-v2/source/SoundSynthesizerEffects.cpp"
            of the functions: 
                  SoundSynthesizerEffects::exponentialRisingInterpolation()
            and   SoundSynthesizerEffects::exponentialFallingInterpolation()
            currently contain maths bugs, so Attack.Delayed is being temporarily removed...

            // add-in appropriate "shape" & "steps" parameters for Delayed effects
            if (attack == Attack.Delayed) {
                let tempSound = new soundExpression.Sound;
                tempSound.src = soundExpr.getNotes();
                if (endPitch > startPitch) {
                    tempSound.shape = soundExpression.InterpolationEffect.ExponentialRising; // (faked with Sin)
                    tempSound.steps = 90; // 1-degree steps
                } else {
                    tempSound.shape = soundExpression.InterpolationEffect.ExponentialFalling; // (faked with Cos)
                    tempSound.steps = 90; // 1-degree steps
                }
                soundExpr = new SoundExpression(tempSound.src);
            }
            */

            // add new sound into the prototype
            this.prototype.parts.push(soundExpr);
            this.nParts++;
        }

        // Create a specifically tuned performance of this FlexFX
        makeTunedPlay(pitch: number, volumeLimit: number, newDuration: number): Play {
            let scaledVolumeLimit = volumeLimit * 4;
            let play = new Play;
            let sound = new soundExpression.Sound;
            let pitchRatio = 1.0;
            let volumeRatio = 1.0;
            let durationRatio = 1.0;  
            // code defensively!
            if (pitch*this.pitchAverage != 0) pitchRatio = pitch / this.pitchAverage;
            if (scaledVolumeLimit * this.peakVolume != 0) volumeRatio = scaledVolumeLimit / this.peakVolume;
            if (newDuration * this.fullDuration != 0) durationRatio = newDuration / this.fullDuration;
            // apply ratios (where changed from 1.0) to relevant fields of each part in turn
            for (let i = 0; i < this.nParts; i++) {
                sound.src = this.prototype.parts[i].getNotes(); // current string
                sound.frequency = this.goodPitch(this.pitchProfile[i] * pitchRatio);
                sound.endFrequency = this.goodPitch(this.pitchProfile[i + 1] * pitchRatio);
                
                if (volumeRatio != 1.0) {
                    sound.volume = this.goodVolume(this.volumeProfile[i] * volumeRatio);
                    sound.endVolume = this.goodVolume(this.volumeProfile[i + 1] * volumeRatio);
                }
                if (durationRatio != 1.0) {
                    sound.duration = this.goodDuration(this.durationProfile[i] * durationRatio);
                }
                play.parts[i] = new SoundExpression(sound.src); // modified string
            }
            return (play);
        }

    }

    // Store a flexFX (overwriting any previous instance)
    function storeFlexFX(target: FlexFX) {
        // first delete any existing definition having this id (works even when missing!)
        flexFXList.splice(flexFXList.indexOf(flexFXList.find(i => i.id === target.id), 1), 1); 
        // add this new definition
        flexFXList.push(target); 
    }

    // kick off the background player (if not already running)
    function activatePlayer() {
        if (!(playerActive || playerStopped)){ 
            playerActive = true;
            control.inBackground(() => player());
        }
    }

    // in turn, play everything currently on the playList
    function player() {
        let play = new Play;
        while ((playList.length > 0) && !playerStopped) {
            let soundString = "";
            play = playList.shift();
            let sound = play.parts[0].getNotes();
            // look out for "silences" that have just one sound-string of "snnn..."
            if (sound.charAt(0) == "s") {
                let time = parseInt("0" + sound.slice(1).trim());
                basic.pause(time); // just wait around... 
            } else {
            // flatten the parts[] of sound-strings into a single comma-separated string
                while (play.parts.length > 0) { 
                    soundString += play.parts.shift().getNotes();
                    if (play.parts.length > 0) {
                        soundString += ",";
                    }
                }
                // now play it synchronously (from the player fiber's perspective!)
                if (soundString.length > 0) { 
                    control.raiseEvent(FLEXFX_ACTIVITY_ID, PLAYER.STARTING);
                    playerPlaying = true;
                    music.playSoundEffect(soundString, SoundExpressionPlayMode.UntilDone);
                    control.raiseEvent(FLEXFX_ACTIVITY_ID, PLAYER.FINISHED);
                    playerPlaying = false;
                }
            }
            basic.pause(10); // always cede control briefly to scheduler 
        }
        if (playList.length == 0) {
             control.raiseEvent(FLEXFX_ACTIVITY_ID, PLAYER.ALLPLAYED);
        } // else we were prematurely stopped by the playerStopped global flag
        playerActive = false;
    }

    // ---- UI BLOCKS: PLAYING ----
    
    /*
     * Perform a FlexFX
     * @flexId  is the name of the FlexFX to be played.
     * @wait  if "true", the FlexFX is played straightaway; else it will be played in the background.
     * 
     * optional parameters (if left as 0, defaults will apply):
     * @pitch  different base-frequency to use (in Hz)
     * @volumeLimit  peak volume, as a number in the range 0-255.
     * @tuneDuration  how long (in milliseconds) the overall performance will last .
     */
    //% block="play FlexFX $id waiting? $wait||at pitch $pitch|with maximum volume: $volumeLimit| lasting (ms) $newDuration"
    //% group="micro:bit(V2) Playing"
    //% inlineInputMode=external
    //% expandableArgumentMode="toggle"
    //% weight=990
    //% id.defl="ting"
    //% wait.defl=true
    //% pitch.min=50 pitch.max=2000 pitch.defl=0
    //% volumeLimit.min=0 volumeLimit.max=255 volumeLimit.defl=200
    //% newDuration.min=0 newDuration.max=10000 newDuration.defl=800
    export function playFlexFX(id: string, wait: boolean = true,
        pitch: number = 0, volumeLimit: number = 0, newDuration: number = 0) {

        pitch = clamp(0, pitch, 2000);
        volumeLimit = clamp(0, volumeLimit, 255);
        newDuration = clamp(0, newDuration, 10000);
       
        let target: FlexFX = flexFXList.find(i => i.id === id);
        if (target == null) {
            target= flexFXList.find(i => i.id === "***"); // "alert" sound
        }
        if (target != null) {
            // compile and add our Play onto the playList 
            playList.push(target.makeTunedPlay(pitch, volumeLimit, newDuration));
            activatePlayer();  // make sure it gets played (unless Stopped)
            if (wait) {
                awaitAllFinished(); // make sure it has been played
            }
        }
    }

    /** builtInFlexFX()
    * Selector block to choose and return the name of a built-in FlexFx
    */
    //% blockId="builtin_name" block="$flexFX"
    //% group="micro:bit(V2) Playing"
    //% weight=980
    export function builtInFlexFX(flexFX: BuiltInFlexFX): string {
        switch (flexFX) {
            case BuiltInFlexFX.Chime: return "chime";
            case BuiltInFlexFX.Cry: return "cry";
            case BuiltInFlexFX.Flute: return "flute";
            case BuiltInFlexFX.Horn: return "horn";
            case BuiltInFlexFX.Hum: return "hum";

            case BuiltInFlexFX.Laugh: return "laugh";
            case BuiltInFlexFX.Miaow: return "miaow";
            case BuiltInFlexFX.Moan: return "moan";
            case BuiltInFlexFX.Moo: return "moo";
            case BuiltInFlexFX.Motor: return "motor";

            case BuiltInFlexFX.Query: return "query";
            case BuiltInFlexFX.Shout: return "shout";
            case BuiltInFlexFX.Siren: return "siren";
            case BuiltInFlexFX.Snore: return "snore";
            case BuiltInFlexFX.Ting: return "ting";

            case BuiltInFlexFX.Tweet: return "tweet";
            case BuiltInFlexFX.Uhoh: return "uhoh";
            case BuiltInFlexFX.Violin: return "violin";
            case BuiltInFlexFX.Whale: return "whale";
            case BuiltInFlexFX.Woof: return "woof";
        }
        return "***" // error beep
    }


    /*
     * Use a FlexFX to play a Tune  
     * @title  is the name of the Tune to be played.
     * @flexId  is the name of the FlexFX to be used to play it.
     * @wait  if "true", the Tune is played to completion; else it will be played in the background.
     * 
     * optional parameters (if left as 0, defaults will apply):
     * @transpose  semitone steps by which to raise (or, if negative, lower) all notes in the Tune.
     * @volumeLimit  peak volume for every note, as a number in the range 0-255.
     * @tuneDuration  how long (in milliseconds) the overall performance should last .
     */

    //% block="play tune $tuneId using FlexFX $flexId waiting? $wait||transposed by (semitones): $transpose|with maximum volume: $volumeLimit|performance lasting (ms) $tuneDuration"    
    //% group="micro:bit(V2) Playing"
    //% weight=970
    //% inlineInputMode=external
    //% expandableArgumentMode="enabled"
    //% tuneId.defl="birthday"
    //% flexId.defl="ting"
    //% wait.defl=true
    //% transpose.min=-60 transpose.max=60 transpose.defl=0
    //% volumeLimit.min=0 volumeLimit.max=255 volumeLimit.defl=200
    //% tuneDuration.min=50 tuneDuration.max=300000 tuneDuration.defl=0
    export function playTune(tuneId: string, flexId: string, wait: boolean = true, 
        transpose: number = 0, volumeLimit: number = 0, tuneDuration: number = 0) {

        transpose = clamp(-60, transpose, 60); // +/- 5 octaves
        volumeLimit = clamp(0, volumeLimit, 255);
        tuneDuration = clamp(0, tuneDuration, 300000); // max 5 mins!
        
        let flex: FlexFX = flexFXList.find(i => i.id === flexId);
        if (flex == null) {
            flex = flexFXList.find(i => i.id === "***"); // error-sound
        }
        let tune: Tune = tuneList.find(i => i.id === tuneId);
        if (tune == null) {
            flex = flexFXList.find(i => i.id === "***"); // error-sound
            tune = tuneList.find(i => i.id === "***"); // triple error-sound "tune"
        }

        if ((flex != null) && (flex != null)) {
            let myTick = tickMs;  // adopt current default tempo
            if (tuneDuration != 0) {
                myTick = tuneDuration / tune.nTicks; // tick-rate needed to achieve tuneDuration
            }
            for (let i = 0; i < tune.notes.length; i++) {
                let note = tune.notes[i];
                let ms = note.ticks * myTick;
                let pitch = note.pitch;
                if (note.volume == 0) { // if this note is a Rest, play silence
                    playSilence(ms);
                } else {
                    if (transpose != 0) {
                        // apply transpose to MIDI then convert back to Hz
                        pitch = midiToHertz(note.midi+transpose);
                    }
                // compile and add our Play onto the playList 
                    playList.push(flex.makeTunedPlay(pitch, volumeLimit, ms));
                }
            }
            activatePlayer();  // make sure it gets played (unless Stopped)
            if (wait) {
                awaitAllFinished(); // make sure it has been played
            }
        }
    }

    /**
     * Selector block to choose and return the name of a built-in Tune
     */
    //% blockId="builtin_tune" block="$tune"
    //% group="micro:bit(V2) Playing"
    //% weight=960
    export function builtInTune(tune: BuiltInTune): string {
        switch (tune) {
            case BuiltInTune.Birthday: return "birthday";
            case BuiltInTune.JingleBells: return "jingleBells";
            case BuiltInTune.TeaPot: return "teaPot";
            case BuiltInTune.IfYoureHappy: return "ifYoureHappy";
            case BuiltInTune.LondonBridge: return "londonBridge";
            case BuiltInTune.OldMacdonald: return "oldMacdonald";
            case BuiltInTune.BearMountain: return "bearMountain";
            case BuiltInTune.PopWeasel: return "popWeasel";
            case BuiltInTune.ThisOldMan: return "thisOldMan";
            case BuiltInTune.RoundMountain: return "roundMountain";
            case BuiltInTune.Edelweiss: return "edelweiss";
            case BuiltInTune.NewWorld: return "newWorld";
            case BuiltInTune.OdeToJoy: return "odeToJoy";
            case BuiltInTune.BachViolin: return "bachViolin";
            default: return "***"; // triple-beep "tune"
        }
    }

    /**
     * Set the speed for playing future Tunes
     * @param bpm   the beats-per-minute(BPM) for playTune() to use
     *              (valid range is 30 to 480)
     */
    //% block="set tempo (beats/minute): %bpm"
    //% group="micro:bit(V2) Playing"
    //% weight=950
    //% bpm.min=30 bpm.max=480 bpm.defl=120
    export function setNextTempo(bpm: number) {  // CHANGES GLOBAL SETTING
        bpm = clamp(30, bpm, 480);
        tickMs = 15000 / bpm; // = (60*1000) / (4*bpm)
    }

    /**
         * Compose a Tune using EKO-notation (Extent-Key-Octave).
         *
         * @param id  the identifier of the Tune to be created or replaced
         * @param score  a text-string listing the notes in the Tune
         */

    //% block="compose Tune: $tuneId with notes: $score"
    //% group="micro:bit(V2) Playing"
    //% weight=940
    //% tuneId.defl="beethoven5"
    //% score.defl="2R 2G4 2G4 2G4 8Eb4"
    export function composeTune(tuneId: string, score: string) {
        // first delete any existing definition having this id (works even when missing!)
        tuneList.splice(tuneList.indexOf(tuneList.find(i => i.id === tuneId), 1), 1);
        // add this new definition
        tuneList.push(new Tune(tuneId, score));
    }

    /**
          * Add notes to a Tune using EKO-notation (Extent-Key-Octave).
          *
          * @param id  the identifier of the Tune to be extended
          * @param score  a text-string listing the notes to be added
          */

    //% block="extend Tune: $tuneId with extra notes: $score"
    //% group="micro:bit(V2) Playing"
    //% weight=930
    //% tuneId.defl="beethoven5"
    //% score.defl="2R 2F4 2F4 2F4 8D4"
    export function extendTune(tuneId: string, score: string) {
        let target: Tune = tuneList.find(i => i.id === tuneId);
        if (target == null) {
            // OOPS! trying to extend a non-existent Tune: 
            // rather than fail, just create a new one
            tuneList.push(new Tune(tuneId, score));
        } else {
            target.extend(score);
        }
    }


    // ---- UI BLOCKS: PLAY-LIST ----

  
    /**
     * Await start of next FlexFX on the play-list
     */
    //% block="wait until next FlexFX starts"
    //% group="micro:bit(V2) Play-list"
    //% weight=890
    //% advanced=true
    export function awaitPlayStart() {
        if (playList.length >= 0) {
            playerStopped = false; // in case it was
            activatePlayer(); // it case it wasn't
            control.waitForEvent(FLEXFX_ACTIVITY_ID, PLAYER.STARTING);
        } // else nothing to wait for
    }

    /**
     * Await completion of FLexFX currently playing
     */
    //% block="wait until current FlexFX finishes"
    //% group="micro:bit(V2) Play-list"
    //% weight=880
    //% advanced=true
    export function awaitPlayFinish() {
        if (playerPlaying) {
            control.waitForEvent(FLEXFX_ACTIVITY_ID, PLAYER.FINISHED);
        } // else nothing to wait for
    }

    /**
     * Await completion of everything on the play-list
     */
    //% block="wait until everything played"
    //% group="micro:bit(V2) Play-list"
    //% weight=870
    //% advanced=true
    export function awaitAllFinished() {
        if (playList.length >= 0) {
            playerStopped = false; // in case it was
            activatePlayer(); // in case it wasn't
            control.waitForEvent(FLEXFX_ACTIVITY_ID, PLAYER.ALLPLAYED);
        } // else nothing to wait for
    }

    /**
     * Add a silent pause to the play-list
     * @param ms  length of pause (in millisecs)
     */
    //% block="add a pause of $ms ms next in the play-list"
    //% group="micro:bit(V2) Play-list"
    //% weight=860
    //% advanced=true
    //% ms.defl=500
    export function playSilence(ms: number) {
        // adds a special-case sound-string of format "snnn.." 
        // so "s2500" adds a silence of 2.5 sec
        ms = clamp(0, ms, 60000);
        let play = new Play;
        play.parts.push(new SoundExpression("s" + convertToText(Math.floor(ms))));
        playList.push(play);
        activatePlayer();  // make sure it gets played (unless Stopped)
    }

    /**
     * Check the length of the play-list
     */
    //% block="length of play-list"
    //% group="micro:bit(V2) Play-list"
    //% weight=850
    //% advanced=true
    export function waitingToPlay(): number {
        return playList.length;
    }

    /**
     * Suspend background playing from the play-list
     */
    //% block="pause play-list"
    //% group="micro:bit(V2) Play-list"
    //% weight=840
    //% advanced=true
    export function stopPlaying() {
        playerStopped = true;
    }

    /**
     * Resume background playing from the play-list
     */
    //% block="play play-list"
    //% group="micro:bit(V2) Play-list"
    //% weight=830
    //% advanced=true
    export function startPlaying() {
        playerStopped = false;
        activatePlayer();
    }

    /**
     * Delete from the play-list everything left unplayed
     */
    //% block="forget play-list"
    //% group="micro:bit(V2) Play-list"
    //% weight=820
    //% advanced=true
    export function deletePlaylist() {
        while (playList.length > 0) { playList.pop() }
    }

  // Accessors for internal flags...
    /**
     * returns "true" if playing is currently inhibited
     */
    //% block="is paused"
    //% group="micro:bit(V2) Play-list"
    //% weight=815
    //% advanced=true
      export function isStopped(): boolean { return playerStopped; } // accessor

    /**
     *  returns "true" if a FlexFX is currently being played
     */
    //% block="is playing"
    //% group="micro:bit(V2) Play-list"
    //% weight=810
    //% advanced=true
   export function isPlaying(): boolean { return playerPlaying; } // accessor
 
    /**
     * returns "true" if the background player is running
     */
    //% block="is active"
    //% group="micro:bit(V2) Play-list"
    //% weight=805
    //% advanced=true
   export function isActive(): boolean { return playerActive; } // accessor


    // ---- UI BLOCKS: CREATING --

    /**
     * Specify the first (or only) part of a new FlexFX.
     * Any existing FlexFX with the same "id" is first deleted.
     * @param id  the identifier of the flexFX to be created or changed
     * @param startPitch  the initial frequency of the sound (in Hz)
     * @param startVolume  the initial volume of the sound (0 to 255)
     * @param wave  chooses the wave-form that characterises this sound
     * @param attack  chooses how fast the sound moves from its initial to final pitch
     * @param effect  chooses a possible modification to the sound, such as vibrato
     * @param endPitch  the final frequency of the sound (in Hz)
     * @param endVolume  the final volume of the sound (0 to 255)
     * @param duration  the duration of the sound (in ms) 
     */

    //% block="define FlexFX: $id| using wave-shape $wave|      with attack $attack|       and effect $effect|  pitch goes from $startPitch|               to $endPitch|volume goes from $startVolume|               to $endVolume|default duration=$duration"
    //% group="micro:bit(V2) Creating"
    //% weight=790
    //% advanced=true
    //% inlineInputMode=external
    //% id.defl="new"
    //% startPitch.min=25 startPitch.max=10000 startPitch.defl=1000
    //% startVolume.min=0 startVolume.max=255 startVolume.defl=200
    //% endPitch.min=25 endPitch.max=10000 endPitch.defl=500
    //% endVolume.min=0 endVolume.max=255 endVolume.defl=100
    //% duration.min=0 duration.max=10000 duration.defl=800

    export function defineFlexFX(id: string, startPitch: number, startVolume: number,
                wave: Wave, attack: Attack, effect: Effect, 
                endPitch: number, endVolume: number, duration: number) {
        
        startPitch = clamp(25, startPitch, 10000);
        startVolume = clamp(0, startVolume, 255);
        endPitch = clamp(25, endPitch, 10000);
        endVolume = clamp(0, endVolume, 255);
        duration = clamp(0, duration, 10000);
        
        // are we re-defining an existing flexFX?
        let target: FlexFX = flexFXList.find(i => i.id === id);
        if (target != null) {
            target.initialise(); // yes, so clear it down
        } else {
            target = new FlexFX(id);    // no, so get a new one
        }
        target.startWith(startPitch, startVolume);
        target.addPart(wave, attack, effect, endPitch, endVolume, duration);
        storeFlexFX(target);
    }

    /**
     * Add another part to an existing FlexFX, continuing from its current final frequency and volume.
     * 
     * @param id  the identifier of the flexFX to be extended
     * @param wave  chooses the wave-form that characterises this next part
     * @param attack  chooses how fast this part moves from its initial to final pitch
     * @param effect  chooses a possible modification to this part, such as vibrato
     * @param endPitch  the new final frequency of the FlexFX (in Hz)
     * @param endVolume  the new final volume of the FlexFX (0 to 255)
     * @param duration  the additional duration of this new part (in ms)
     */

    //% block="continue FlexFX: $id| using wave-shape $wave|      with attack $attack|       and effect $effect|  pitch goes to $endPitch|volume goes to $endVolume| extended by (ms) $duration"
    //% group="micro:bit(V2) Creating"
    //% weight=780
    //% advanced=true
    //% inlineInputMode=external
    //% id.defl="new"
    //% endPitch.min=25 endPitch.max=4000 endPitch.defl=500
    //% endVolume.min=0 endVolume.max=255 endVolume.defl=200
    //% duration.min=0 duration.max=10000 duration.defl=500

    export function extendFlexFX(id: string, wave: Wave, attack: Attack, effect: Effect,
                endPitch: number, endVolume: number, duration: number) {
        
        endPitch = clamp(25, endPitch, 10000);
        endVolume = clamp(0, endVolume, 255);
        duration = clamp(0, duration, 10000);

        // force our enums into numbers
        let waveNumber: number = wave;
        let effectNumber: number = effect;
        let attackNumber: number = attack;
        let target: FlexFX = flexFXList.find(i => i.id === id);
        if (target == null) {
            // OOPS! trying to extend a non-existent flexFX: 
            // rather than fail, just create a new one, but with flat profiles
            defineFlexFX(id,waveNumber,endPitch,endPitch,endVolume,endVolume,duration,effectNumber,attackNumber);
        } else {
            // TODO: do we need to use waveNumber etc. ? Don't think so!
            target.addPart(wave, attack, effect, endPitch, endVolume, duration);
        }
        storeFlexFX(target);
    }

 // general initialisation...
    // lists...
    // Array of all defined FlexFX objects (built-in and user-defined)
    let flexFXList: FlexFX[] = [];
    // Performances get queued onto the play-list to ensure proper asynchronous sequencing
    let playList: Play[] = [];
    // Tunes can be registered separately from FlexFXs
    // You can then mix & match them using playTune(flexId,tuneId)
    let tuneList: Tune[] = [];
    let tickMs = DEFAULT_TICKMS; // default tune speed

    // control flags:
    let playerPlaying = false; // a performance is being played
    let playerActive = false;
    let playerStopped = false; // activation of player inhibited for now
    
    // Populate the FlexFX array with the selection of built-in sounds
    function populateBuiltInFlexFXs() {
        // error FlexFX
        defineFlexFX("***", 4000, 255, Wave.Triangle, Attack.Fast, Effect.None, 100, 255, 10);
        
        // wailing sound
        defineFlexFX("cry", 400, 80, Wave.Square, Attack.Medium, Effect.None, 600, 250, 300);
        extendFlexFX("cry", Wave.Square, Attack.Even, Effect.None, 400, 30, 700);
        // longer chime effect
        defineFlexFX("chime", 315, 200, Wave.Sine, Attack.Fast, Effect.None, 300, 20, 300);
        extendFlexFX("chime", Wave.Sine, Attack.Even, Effect.None, 300, 0, 1000);
        // somewhat cat-like
        defineFlexFX("miaow", 630, 127, Wave.Sawtooth, Attack.Even, Effect.None, 900, 255, 300);
        extendFlexFX("miaow", Wave.Sawtooth, Attack.Even, Effect.None, 810, 200, 700);
        // breathy flute
        defineFlexFX("flute", 25, 262, Wave.Noise, Attack.Fast, Effect.Vibrato, 1000, 250, 75);
        extendFlexFX("flute", Wave.Triangle, Attack.Fast, Effect.None, 1000, 250, 1200);
        extendFlexFX("flute", Wave.Triangle, Attack.Even, Effect.None, 900, 0, 225);
        // French Horn (-ish)
        defineFlexFX("horn", 12, 127, Wave.Sawtooth, Attack.Fast, Effect.None, 250, 255, 25);
        extendFlexFX("horn", Wave.Sine, Attack.Even, Effect.None, 250, 255, 600);
        extendFlexFX("horn", Wave.Sine, Attack.Even, Effect.None, 200, 0, 70);

        // a gentle hum...
        defineFlexFX("hum", 300, 80, Wave.Triangle, Attack.Fast, Effect.None, 500, 80, 10);
        extendFlexFX("hum", Wave.Sawtooth, Attack.Fast, Effect.None, 250, 100, 30);
        extendFlexFX("hum", Wave.Square, Attack.Even, Effect.None, 250, 90, 570);
        // single laugh (repeat for giggles)
        defineFlexFX("laugh", 280, 80, Wave.Sawtooth, Attack.Fast, Effect.None, 500, 250, 500);
        extendFlexFX("laugh", Wave.Square, Attack.Even, Effect.None, 280, 250, 50);
        // sad whimpering moan
        defineFlexFX("moan", 540, 90, Wave.Triangle, Attack.Even, Effect.None, 450, 150, 420);
        extendFlexFX("moan", Wave.Triangle, Attack.Even, Effect.None, 427, 200, 210);
        extendFlexFX("moan", Wave.Triangle, Attack.Even, Effect.None, 517, 82, 70);
        // somewhat cow-like
        defineFlexFX("moo", 98, 160, Wave.Sawtooth, Attack.Even, Effect.None, 140, 250, 600);
        extendFlexFX("moo", Wave.Sawtooth, Attack.Even, Effect.None, 98, 180, 900);
        // engine-noise (kind-of)
        defineFlexFX("motor", 105, 240, Wave.Sawtooth, Attack.Fast, Effect.Tremolo, 150, 200, 450);
        extendFlexFX("motor", Wave.Sawtooth, Attack.Even, Effect.Tremolo, 120, 200, 2550);

        // questioning...
        defineFlexFX("query", 330, 50, Wave.Square, Attack.Fast, Effect.None, 300, 250, 200);
        extendFlexFX("query", Wave.Square, Attack.Even, Effect.None, 450, 180, 350);
        // angry shout
        defineFlexFX("shout", 120, 125, Wave.Sawtooth, Attack.Fast, Effect.None, 400, 200, 250);
        extendFlexFX("shout", Wave.Sawtooth, Attack.Even, Effect.None, 360, 250, 250);
        extendFlexFX("shout", Wave.Sawtooth, Attack.Even, Effect.None, 120, 187, 125);
        // Police siren (includes a silent gap)
        defineFlexFX("siren", 760, 160, Wave.Sawtooth, Attack.Even, Effect.None, 800, 200, 450);
        extendFlexFX("siren", Wave.Silence, Attack.Even, Effect.None, 560, 200, 100);
        extendFlexFX("siren", Wave.Sawtooth, Attack.Even, Effect.None, 600, 160, 450);
        // Approximation to a snore!
        defineFlexFX("snore", 3500, 22, Wave.Noise, Attack.Even, Effect.Vibrato, 700, 222, 500);
        extendFlexFX("snore", Wave.Noise, Attack.Even, Effect.Vibrato, 5000, 222, 500);
        // simplest bell
        defineFlexFX("ting", 2000, 255, Wave.Triangle, Attack.Fast, Effect.None, 2000, 20, 300);
        
        // little birdie
        defineFlexFX("tweet", 960, 112, Wave.Sine, Attack.Fast, Effect.None, 1200, 250, 700);
        // trouble ahead! (includes a silent gap in the middle)
        defineFlexFX("uhoh", 165, 80, Wave.Sawtooth, Attack.Fast, Effect.None, 180, 200, 200);
        extendFlexFX("uhoh", Wave.Silence, Attack.Even, Effect.None, 142.5, 200, 200);
        extendFlexFX("uhoh", Wave.Square, Attack.Even, Effect.None, 127, 150, 600);
        // Violin-like
        defineFlexFX("violin", 4, 200, Wave.Sawtooth, Attack.Fast, Effect.None, 440, 150, 50);
        extendFlexFX("violin", Wave.Sawtooth, Attack.Even, Effect.None, 440, 150, 425);
        extendFlexFX("violin", Wave.Sawtooth, Attack.Even, Effect.None, 44, 200, 25);
        // whale-song
        defineFlexFX("whale", 540, 22, Wave.Square, Attack.Even, Effect.None, 405, 222, 200);
        extendFlexFX("whale", Wave.Square, Attack.Even, Effect.None, 450, 222, 800);
        extendFlexFX("whale", Wave.Square, Attack.Even, Effect.None, 360, 11, 1000);
        // strange breed of dog
        defineFlexFX("woof", 50, 200, Wave.Square, Attack.Fast, Effect.Vibrato, 100, 250, 50);
        extendFlexFX("woof", Wave.Sawtooth, Attack.Medium, Effect.None, 450, 250, 200);
        extendFlexFX("woof", Wave.Sawtooth, Attack.Even, Effect.None, 150, 90, 75);

   }

    function populateBuiltInTunes() {
        composeTune("***", "2C8 2R 2C8 2R 4C8") // error "Tune"

        composeTune("birthday", "2G4 1G4 3A4 3G4 3C5 6B4 ");
        extendTune("birthday", "2G4 1G4 3A4 3G4 3D5 6C5");
        extendTune("birthday", "2G4 1G4 3G5 3E5 3C5 3B4 6A4");
        extendTune("birthday", "2F5 1F5 3E5 3C5 3D5 6C5");

        composeTune("jingleBells", "2E5 2E5 4E5 2E5 2E5 4E5");
        extendTune("jingleBells", "2E5 2G5 3C5 1D5 4E5 4R");
        extendTune("jingleBells", "2F5 2F5 3F5 1F5 2F5 2E5 2E5 2E5");
        extendTune("jingleBells", "2E5 2D5 2D5 2E5 2D5 2R 2G5 2R");
        extendTune("jingleBells", "2E5 2E5 4E5 2E5 2E5 4E5");
        extendTune("jingleBells", "2E5 2G5 3C5 1D5 4E5 4R");
        extendTune("jingleBells", "2F5 2F5 3F5 1F5 2F5 2E5 2E5 2E5");
        extendTune("jingleBells", "2G5 2G5 2F5 2D5 6C5");

        composeTune("teaPot", "2C4 1D4 2E4 1F4 3G4 3C5 3A4 3C5 6G4");
        extendTune("teaPot", "3F4 3G4 3E4 3C4 3D4 3B3 6C4");
        extendTune("teaPot", "2C5 1B4 2A4 1C5 3B4 3G4 3A4 3C5 6G4");
        extendTune("teaPot", "5C5 1A4 3G4 3F4 3E4 3D4 6C4");

        composeTune("ifYoureHappy", "2C4 1C4 2F4 1F4 2F4 1F4 2F4 1F4 2E4 1F4 6G4 3R");
        extendTune("ifYoureHappy", "2C4 1C4 2G4 1G4 2G4 1G4 2G4 1G4 2F4 1G4 6A4 3R");
        extendTune("ifYoureHappy", "2A4 1A4 2Bb4 1Bb4 2Bb4 1Bb4 2D4 1D4");
        extendTune("ifYoureHappy", "2Bb4 1Bb4 2A4 1A4 2A4 1A4 2C4 1C4");
        extendTune("ifYoureHappy", "2A4 1A4 2G4 1G4 2G4 1G4 2F4 1E4 2D4 1E4 9F4");

        composeTune("londonBridge", "3G4 1A4 2G4 2F4 2E4 2F4 4G4 2D4 2E4 4F4 2E4 2F4 4G4");
        extendTune("londonBridge", "3G4 1A4 2G4 2F4 2E4 2F4 4G4 4D4 4G4 2E4 6C4");


        composeTune("oldMacdonald", "2G4 2G4 2G4 2D4 2E4 2E4 4D4 2B4 2B4 2A4 2A4 4G4 2R");
        extendTune("oldMacdonald", "2D4 2G4 2G4 2G4 2D4 2E4 2E4 4D4 2B4 2B4 2A4 2A4 4G4 2R");
        extendTune("oldMacdonald", "1D4 1D4 2G4 2G4 2G4 1D4 1D4 2G4 2G4 2G4 2R");
        extendTune("oldMacdonald", "1G4 1G4 2G4 1G4 1G4 2G4 1G4 1G4 1G4 1G4 2G4 2G4");
        extendTune("oldMacdonald", "2G4 2G4 2G4 2D4 2E4 2E4 4D4 2B4 2B4 2A4 2A4 4G4");

        composeTune("bearMountain", "1D4 2E4 1E4 1E4 1D4 1E4 3F4 2E4");
        extendTune("bearMountain", "1E4 2D4 1D4 1D4 1C4 1D4 3E4 2C4");
        extendTune("bearMountain", "1D4 2E4 1E4 1E4 1D4 1E4 2F4 1G4 5A4");
        extendTune("bearMountain", "1A4 2G4 1F4 2E4 1D4 4C4");

        composeTune("popWeasel", "2C4 1E4 2D4 1F4 1E4 1G4 1E4 3C4");
        extendTune("popWeasel", "2C4 1E4 2D4 1F4 3E4 3C4");
        extendTune("popWeasel", "2C4 1E4 2D4 1F4 1E4 1G4 1E4 3C4");
        extendTune("popWeasel", "3A4 2D4 1F4 3E4 3C4");

        composeTune("thisOldMan", "2G4 2E4 2G4 2R 2G4 2E4 2G4 2R");
        extendTune("thisOldMan", "2A4 2G4 2F4 2E4 2D4 2E4 2F4");
        extendTune("thisOldMan", "1E4 1F4 2G4 2C4 2C4 2C4 1C4 1D4 1E4 1F4 2G4 2R");
        extendTune("thisOldMan", "2G4 2D4 2D4 2F4 2E4 2D4 4C4");

        composeTune("roundMountain", "2D4 2E4 2G4 2G4 2G4 2G4 2E4 2D4 2B3 2D4 8G4 4R");
        extendTune("roundMountain", "2G4 2A4 2B4 2B4 2B4 2B4 2D5 2D5 2D5 2B4 8A4 4R");
        extendTune("roundMountain", "2D5 2C5 2B4 2B4 2B4 2B4 2A4 6G4 2E4 2E4 2E4 2E4 2C5 2C5");
        extendTune("roundMountain", "2D5 2C5 2B4 2B4 2B4 2B4 2A4 2A4 2B4 2A4 12G4");


        composeTune("edelweiss", "4E4 2G4 6D5 4C5 2G4 6F4");
        extendTune("edelweiss", "4E4 2E4 2E4 2F4 2G4 6A4 6G4");
        extendTune("edelweiss", "4E4 2G4 6D5 4C5 2G4 6F4");
        extendTune("edelweiss", "4E4 2G4 2G4 2A4 2B4 6C5 6C5");
        extendTune("edelweiss", "3D5 1G4 2G4 3B4 1A4 2G4 4E4 2G4 6C5");
        extendTune("edelweiss", "4A4 2C5 4D5 2C5 6B4 6G4");
        extendTune("edelweiss", "4E4 2G4 6D5 4C5 2G#4 6F5");
        extendTune("edelweiss", "4E4 2G4 2G4 2A4 2B4 6C5 6C5");

        composeTune("newWorld", "6E4 2G4 8G4 6E4 2D4 8C4");
        extendTune("newWorld", "4D4 4E4 4G4 4E4 8D4 8R");
        extendTune("newWorld", "6E4 2G4 8G4 6E4 2D4 8C4");
        extendTune("newWorld", "4D4 4E4 6D4 2C4 8C4 8R");

        composeTune("odeToJoy", "4B4 4B4 4C5 4D5 4D5 4C5 4B4 4A4");
        extendTune("odeToJoy", "4G4 4G4 4A4 4B4 6B4 2A4 8A4");
        extendTune("odeToJoy", "4B4 4B4 4C5 4D5 4D5 4C5 4B4 4A4");
        extendTune("odeToJoy", "4G4 4G4 4A4 4B4 6A4 2G4 8G4");
        extendTune("odeToJoy", "4A4 4A4 4B4 4G4 4A4 2B4 2C5 4B4");
        extendTune("odeToJoy", "4G4 4A4 2B4 2C5 4B4 4A4 4G4 4A4 4D4");
        extendTune("odeToJoy", "8B4 4B4 4C5 4D5 4D5 4C5 4B4 4A4");
        extendTune("odeToJoy", "4G4 4G4 4A4 4B4 6A4 2G4 8G4");

        composeTune("bachViolin", "2E5 6A5 2E5 6F5 2D5 1E5 1D5 1C5 1E5");
        extendTune("bachViolin", "1D5 1C5 1B4 1D5 2C5 4A4 1R 1A4 1G#4 1A4");
        extendTune("bachViolin", "1B4 1A4 1G#4 1A4 1C5 1A4 1G#4 1A4");
        extendTune("bachViolin", "1D5 1A4 1G#4 1A4 1E5 1A4 1G#4 1A4");
        extendTune("bachViolin", "1F5 1G5 1F5 1E5 1D5 1C5 1B4 1A4 2G#4 6E4");

    }

    populateBuiltInFlexFXs();
    populateBuiltInTunes();
}
