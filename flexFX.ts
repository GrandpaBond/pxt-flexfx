/* FlexFX
While the built-in facilities for creating sound-effects are impressively flexible,
they are insufficiently flexible for some contexts (such as to properly express moods and emotions.)

This extension allows the creation of more complex sounds, that have inflections in both pitch 
and volume. In the context of mood-sounds, this might include a laugh, a moan or an "Uh-oh" that indicates a problem.

To achieve this we have defined a flexible sound-effect class called a "FlexFX", which embodies one or more sound parts 
that play consecutively to give a smoothly varying result. A FlexFX can either be played as defined, 
or its pitch, volume and duration can be independently scaled to suit requirements.

For the novice, a selection of interesting built-in FlexFX samples (musical or otherwise) are provided.

The core microbit function music.playSoundEffect() offers a playInBackground option. Unfortunately, a subsequent 
playSoundEffect() interrupts this, rather than queuing sounds up, so the FlexFX class therefore 
implements its own play-list to achieve the queueing of consecutive background sounds.

A sequence of pitched instrument sounds forms a Tune. A flexFX.Tune can be composed using a "score" string to specify
the length; note-name; and octave for a series of notes. Subsequently, any FlexFX can be used to play this tune.

For the novice, a (small) selection of built-in tunes is provided.
*/

/* NOTE:    The built-in enums for sound effect parameters are hardly beginner-friendly!
            By renaming them we can expose somewhat simpler concepts, but this only seems 
            to work if we pass them over a function-call as arguments of type: number.
*/


/**
 * Tools for creating composite sound-effects of class FlexFX that can be performed 
 * (either directly or queued-up) as defined; or with scaled pitch, volume or duration.
 */

//% color=#70e030
//% icon="\uf0a1"
//% block="FlexFX"
//% groups="['Playing', 'Play-list', 'Creating']"
namespace flexFX {  

    // Simplify the selection of wave-shape...
    export enum Wave {
        //%block="Silence"
        Silence = -1,    // (special case for queueing silent gaps onto the Play-list) 
        //%block="Pure"
        Sine = WaveShape.Sine,
        //%block="Buzzy"
        Square = WaveShape.Square,
        //%block="Bright"
        Triangle = WaveShape.Triangle,
        //%block="Harsh"
        Sawtooth = WaveShape.Sawtooth,
        //%block="Noisy"
        Noise = WaveShape.Noise
    }
    // Simplify the selection of frequency interpolation trajectory...
    export enum Attack {
        //% block="Fast"
        Fast = InterpolationCurve.Logarithmic,
        //% block="Medium"
        Medium = InterpolationCurve.Curve,
        //% block="Even"
        Even = InterpolationCurve.Linear,
        //% block="Delayed"
        Delayed = 99 // later, mapped to Sine or Cosine, depending on slope of profile
    }
    // Simplify (slightly) the selection of modulation-style...
    export enum Effect {
        //% block="None"
        None = SoundExpressionEffect.None,
        //% block="Vibrato"
        Vibrato = SoundExpressionEffect.Vibrato,
        //% block="Tremolo"
        Tremolo = SoundExpressionEffect.Tremolo,
        //% block="Warble"
        Warble = SoundExpressionEffect.Warble
    }

    // list of built-in FlexFXs
    // **** must precicely match the ID array BuiltInId below ****
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

    // array of built-in FlexFX ids (no longer needed)
    /**** must precicely match the enum BuiltInFlexFX above
    let builtInId: string[] = [
        "chime", "cry", "flute", "horn", "hum",        // [0...4]
        "laugh", "miaow", "moan", "moo", "motor",      // [5...9]
        "query", "shout", "siren", "snore","ting",     // [10...14]
        "tweet", "uh-oh", "violin", "whale", "woof" ]; // [15...19]
     ****/

    // list of built-in Tunes
    export enum BuiltInTune {
        //% block="happy birthday"
        Birthday,
        //% block="new world"
        NewWorld,
        //% block="bach"
        Bach,
        //% block="beethoven"
        Beethoven
    }
    
    // constants used in conversions between frequency & MIDI note-number:
    // a SEMITONE ratio = 12th root of 2 (as 12 semitones make an octave, which doubles the frequency)
    const SEMILOG = 0.057762265047;    // =  Math.log(2) / 12;
    const SEMITONE = 1.0594630943593;  // = Math.exp(SEMILOG) 
    const DELTA = 36.3763165623;       // = (Math.log(440) / SEMILOG) - 69;
 
    // convert a frequency in Hz to its Midi note-number 
    // (retaining microtonal fractions)
    export function hertzToMidi(pitch: number): number {
        return ((Math.log(pitch) / SEMILOG) - DELTA);
    }

    // convert a Midi note-number to nearest integer frequency in Hz
    // (based on A4 = 440 Hz = MIDI 69)
    export function midiToHertz(midi: number): number {
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
        name: string = ""; // e.g. "C4" for middle-C
        ticks: number = 0; // note-extent, measured in quarter-beat "ticks"
        midi: number = 0; // standard MIDI note-number
        pitch: number = 0; // frequency in Hz
        volume: number = 0;  // UI volume [0..255] (quadrupled internally)

        // create using a 3-part EKO-notation specifier: {extent}{key}{octave}
        constructor(spec: string) {
            let chars = spec.toUpperCase();
            // parse {extent} in ticks [0-9]*
 
            let code = chars.charCodeAt(0);
            while ((code > 47) && (code < 58)) {
                this.ticks = this.ticks * 10 + code - 48
                chars = chars.slice(1);
                code = chars.charCodeAt(0);
            }
            this.name = chars; // save the note-name {Key}{Octave}...     
            if (chars[1] == "B") {  // ...using lower-case "b" for flats
                this.name = chars[0] + "b" + chars.slice(2);
            }

        // for a silent musical rest, {Key} = "R" and {Octave} is absent
            if (chars[0] != "R") {
                this.volume = 255; // remains at 0 for special-case musical Rests
                // parse {key} as [A-G]
                let key = 2 * ((code - 60) % 7);
                if (key > 4) key--;
                chars = chars.slice(1);

                // adjust for accidentals [# or b]
                if (chars[0] == "#") {
                    key++;
                    chars = chars.slice(1);
                }
                if (chars[0] == "B") {
                    key--;
                    chars = chars.slice(1);
                }
                // parse {Octave} as [0-9]*
                let octave = 0;
                code = chars.charCodeAt(0);
                while ((code > 47) && (code < 58)) {
                    octave = octave * 10 + code - 48
                    chars = chars.slice(1);
                    code = chars.charCodeAt(0);
                }
                // get MIDI from key & octave 
                // (careful: MIDI for C0 is 12)
                this.midi = 12 * (octave + 1) + key;
                this.pitch = midiToHertz(this.midi);
            }
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
            let specs = source.split(" ");
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
            
            let v = this.goodVolume(endVolume*4);
            this.volumeProfile.push(v);
            this.peakVolume = Math.max(this.peakVolume, v);

            let d = this.goodDuration(duration);
            this.durationProfile.push(d);

            // turn our enums into simple numbers & create the sound string for this part
            let waveNumber: number = wave;
            let effectNumber: number = effect;
            let attackNumber: number = attack;
            let startPitch = this.pitchProfile[this.nParts];
            let startVolume = this.volumeProfile[this.nParts]
    
            if (wave == Wave.Silence) {
                // ensure this part plays silently, while preserving the end-point of the previous part 
                // and the start-point of any following part
                startVolume = 0;
                endVolume = 0;
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
                    case Attack.Delayed: blend = 0.8; // mostly Start pitch
                        break;
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
                startVolume, endVolume, duration, effectNumber, attackNumber);      
    
            // add-in appropriate "shape" & "steps" parameters for Delayed effects
            if (attack == Attack.Delayed) {
                let tempSound = new soundExpression.Sound;
                tempSound.src = soundExpr.getNotes();
                if (endPitch > startPitch) {
                    tempSound.shape = soundExpression.InterpolationEffect.ExponentialRising; // (faked with Sin)
                    tempSound.steps = 30; // Try this!
                } else {
                    tempSound.shape = soundExpression.InterpolationEffect.ExponentialFalling; // (faked with Cos)
                    tempSound.steps = 30; // Try this!
                }
                soundExpr = new SoundExpression(tempSound.src);
            }

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

    // ---- UI BLOCKS ----
    
    /** builtInFlexFX()
     * Selector block to choose and return the name of a built-in FlexFx
     */
    //% blockId="builtin_name" block="$fx"
    //% group="Playing"
    //% weight=305
    export function builtInFlexFX(fx: BuiltInFlexFX): string {
        switch (fx) {
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
            case BuiltInFlexFX.Uhoh: return "uh-oh";
            case BuiltInFlexFX.Violin: return "violin";
            case BuiltInFlexFX.Whale: return "whale";
            case BuiltInFlexFX.Woof: return "woof";
        }
        return "ting"
    }

    /*
     * Perform a FlexFX
     * @flexId  is the name of the FlexFX to be played.
     * @wait  if "true", the FlexFX is played straightaway; else it will be played in the background.
     * optional parameters (if left 0, defaults will apply):
     * @pitch  different base-frequency to use (in Hz)
     * @volumeLimit  peak volume, as a number in the range 0-255.
     * @tuneDuration  how long (in milliseconds) the overall performance will last .
     */
    //% block="play FlexFX $id waiting? $wait||at pitch $pitch|with maximum volume: $volumeLimit| lasting (ms) $newDuration"
    //% group="Playing"
    //% inlineInputMode=external
    //% expandableArgumentMode="toggle"
    //% weight=310
    //% id.defl="ting"
    //% wait.defl=true
    //% pitch.min=50 pitch.max=2000 pitch.defl=0
    //% vol.min=0 vol.max=255 vol.defl=200
    //% ms.min=0 ms.max=10000 ms.defl=800
    export function playFlexFX(id: string, wait: boolean = true,
        pitch: number = 0, volumeLimit: number = 0, newDuration: number = 0) {
        let target: FlexFX = flexFXList.find(i => i.id === id);
        if (target != null) {
            // compile and add our Play onto the playList 
            playList.push(target.makeTunedPlay(pitch, volumeLimit, newDuration));
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
    //% group="Playing"
    //% weight=305
    export function builtInTune(tune: BuiltInTune): string {
        switch (tune) {
            case BuiltInTune.Birthday: return "birthday";
            case BuiltInTune.NewWorld: return "newWorld";
            case BuiltInTune.Bach: return "bach";
            case BuiltInTune.Beethoven: return "beethoven";
        }
        return "beethoven";
    }

    /*
     * Use a FlexFX to play a Tune  
     * @title  is the name of the Tune to be played.
     * @flexId  is the name of the FlexFX to be used to play it.
     * @wait  if "true", the Tune is played to completion; else it will be played in the background.
     * optional parameters (if left 0, defaults will apply):
     * @transpose  semitone steps by which to raise (or, if negative, lower) all notes in the Tune.
     * @volumeLimit  peak volume for every note, as a number in the range 0-255.
     * @tuneDuration  how long (in milliseconds) the overall performance should last .
     */

    //% block="play tune $tuneId using FlexFX $flexId waiting?$wait||transposed by (semitones): $transpose|with maximum volume: $volumeLimit|performance lasting (ms) $tuneDuration"    
    //% group="Playing"
    //% inlineInputMode=external
    //% expandableArgumentMode="enabled"
    //% weight=310
    //% flexId.defl="ting"
    //% tuneId.defl="happy birthday"
    //% wait.defl=true
    //% transpose.defl=0
    //% volumeLimit.defl=0
    //% tuneDuration.defl=0
    export function playTune(tuneId: string, flexId: string, wait: boolean = true, 
        transpose: number = 0, volumeLimit: number = 0, tuneDuration: number = 0) {
        let tune: Tune = tuneList.find(i => i.id === tuneId);
        let flex: FlexFX = flexFXList.find(i => i.id === flexId);
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
     * Await start of next FlexFX on the play-list
     */
    //% block="wait until next FlexFX starts"
    //% group="Play-list"
    //% weight=270
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
    //% block="wait until current FlexFX finished"
    //% group="Play-list"
    //% weight=260
    export function awaitPlayFinish() {
        if (playerPlaying) {
            control.waitForEvent(FLEXFX_ACTIVITY_ID, PLAYER.FINISHED);
        } // else nothing to wait for
    }

    /**
     * Await completion of everything on the play-list
     */
    //% block="wait until everything played"
    //% group="Play-list"
    //% weight=250
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
    //% group="Play-list"
    //% weight=240
    //% ms.defl=500
    export function playSilence(ms: number) {
        // adds a special-case sound-string of format "snnn.." 
        // so "s2500" adds a silence of 2.5 sec
        let play = new Play;
        play.parts.push(new SoundExpression("s" + convertToText(Math.floor(ms))));
        playList.push(play);
        activatePlayer();  // make sure it gets played (unless Stopped)
    }

    /**
     * Check the length of the play-list
     */
    //% block="length of play-list"
    //% group="Play-list"
    //% weight=230
    export function waitingToPlay(): number {
        return playList.length;
    }

    /**
     * Suspend background playing from the play-list
     */
    //% block="pause play-list"
    //% group="Play-list"
    //% weight=220
    export function stopPlaying() {
        playerStopped = true;
    }

    /**
     * Resume background playing from the play-list
     */
    //% block="play play-list"
    //% group="Play-list"
    //% weight=210
    export function startPlaying() {
        playerStopped = false;
        activatePlayer();
    }


    /**
     * Delete from the play-list everything left unplayed
     */
    //% block="forget play-list"
    //% group="Play-list"
    //% weight=200
    export function deletePlaylist() {
        while (playList.length > 0) { playList.pop() }
    }


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
    //% group="Creating"
    //% inlineInputMode=external
    //% advanced=true
    //% weight=150
    //% id.defl="new"
    //% startPitch.min=25 startPitch.max=10000 startPitch.defl=1000
    //% startVolume.min=0 startVolume.max=255 startVolume.defl=200
    //% endPitch.min=25 endPitch.max=10000 endPitch.defl=500
    //% endVolume.min=0 endVolume.max=255 endVolume.defl=100
    //% duration.min=0 duration.max=10000 duration.defl=800

    export function defineFlexFX(id: string, startPitch: number, startVolume: number,
                wave: Wave, attack: Attack, effect: Effect, 
                endPitch: number, endVolume: number, duration: number) {
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
    //% group="Creating"
    //% inlineInputMode=external
    //% advanced=true
    //% weight=140
    //% id.defl="new"
    //% endPitch.min=25 endPitch.max=4000 endPitch.defl=500
    //% endVolume.min=0 endVolume.max=255 endVolume.defl=200
    //% duration.min=0 duration.max=10000 duration.defl=500

    export function extendFlexFX(id: string, wave: Wave, attack: Attack, effect: Effect,
                endPitch: number, endVolume: number, duration: number) {

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

    /**
         * Compose a Tune using EKO-notation (Extent-Key-Octave).
         *
         * @param id  the identifier of the Tune to be created or replaced
         * @param score  a text-string listing the notes in the Tune
         */

    //% block="compose Tune: $tuneId with notes: $score"
    //% group="Creating"
    //% advanced=true
    //% weight=130
    //% tuneId.defl="beethoven5"
    //% score.defl="2R 2G4 2G4 2G4 8Eb4"
    //% score.defl=""
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
    //% group="Creating"
    //% advanced=true
    //% weight=120
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

    /**
     * Set the speed for future Tunes
     * @param bpm   the beats-per-minute(BPM) for playTune() to use
     */
    //% block="set Tune speed (beats/minute) %bpm"
    //% bpm.defl=120
    //% group="Play-list"
    //% weight=210
    export function setNextTempo(bpm: number) {  // CHANGES GLOBAL SETTING
        tickMs = 15000/bpm; // = (60*1000) / (4*bpm)
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
    export function isPlaying(): boolean { return playerPlaying; } // accessor

    let playerActive = false;
    export function isActive(): boolean { return playerActive; } // accessor

    let playerStopped = false; // activation of player inhibited for now
    export function isStopped(): boolean { return playerStopped; } // accessor


    // Populate the FlexFX array with the selection of built-in sounds
    function populateBuiltInFlexFXs() {
        // simple "ting"
        defineFlexFX("ting", 2000, 255, Wave.Triangle, Attack.Fast, Effect.None, 2000, 50, 200);
        // longer chime effect
        defineFlexFX("chime", 315, 200, Wave.Sine, Attack.Fast, Effect.None, 300, 100, 400);
        extendFlexFX("chime", Wave.Sine, Attack.Even, Effect.None, 300, 30, 1600);
        // wailing sound
        defineFlexFX("cry", 200, 125, Wave.Square, Attack.Even, Effect.None, 800, 250, 264);
        extendFlexFX("cry", Wave.Square, Attack.Even, Effect.None, 400, 250, 264);
        extendFlexFX("cry", Wave.Square, Attack.Even, Effect.None, 600, 125, 272);
        // breathy flute
        defineFlexFX("flute", 25, 262,  Wave.Noise,  Attack.Fast,  Effect.Vibrato, 250, 250, 75);
        extendFlexFX("flute", Wave.Triangle, Attack.Fast, Effect.None, 2250, 250, 1200);
        extendFlexFX("flute", Wave.Triangle, Attack.Even, Effect.None, 200, 0, 225);
        // French Horn (-ish)
        defineFlexFX("horn", 12, 127, Wave.Sawtooth, Attack.Fast, Effect.None, 250, 255, 35);
        extendFlexFX("horn", Wave.Sine, Attack.Even, Effect.None, 250, 255, 465);
        // a gentle hum...
        defineFlexFX("hum", 750, 80, Wave.Sawtooth, Attack.Fast, Effect.None, 250, 90, 30);
        extendFlexFX("hum", Wave.Square, Attack.Even, Effect.None, 250, 90, 570);
        // single laugh (repeat for giggles)
        defineFlexFX("laugh", 280, 100, Wave.Sawtooth, Attack.Fast, Effect.None, 400, 250, 450);
        extendFlexFX("laugh", Wave.Square, Attack.Even, Effect.None, 280, 250, 50);
        // somewhat cat-like
        defineFlexFX("miaow", 630, 127, Wave.Sawtooth, Attack.Even, Effect.None, 900, 255, 300);
        extendFlexFX("miaow", Wave.Sawtooth, Attack.Even, Effect.None, 810, 255, 700);
        // sad whimpering moan
        defineFlexFX("moan", 540, 90, Wave.Triangle, Attack.Even, Effect.None, 450, 150, 420);
        extendFlexFX("moan", Wave.Triangle, Attack.Even, Effect.None, 427, 150, 210);
        extendFlexFX("moan", Wave.Triangle, Attack.Even, Effect.None, 517, 82, 70);
        // somewhat cow-like
        defineFlexFX("moo", 98, 160, Wave.Sawtooth, Attack.Even, Effect.None, 140, 200, 600);
        extendFlexFX("moo", Wave.Sawtooth, Attack.Even, Effect.None, 98, 200, 900);
        // engine-noise (kind-of)
        defineFlexFX("motor", 105, 240, Wave.Sawtooth, Attack.Fast, Effect.Tremolo, 150, 200, 450);
        extendFlexFX("motor", Wave.Sawtooth, Attack.Even, Effect.Tremolo, 120, 200, 2550);
        // questioning...
        defineFlexFX("query", 330, 50, Wave.Square, Attack.Even, Effect.None, 300, 250, 180);
        extendFlexFX("query", Wave.Square, Attack.Even, Effect.None, 450, 250, 720);
        // Police siren (includes a silent gap)
        defineFlexFX("siren", 760, 160, Wave.Sawtooth, Attack.Even, Effect.None, 800, 200, 450);
        extendFlexFX("siren", Wave.Silence, Attack.Even, Effect.None, 560, 200, 100);
        extendFlexFX("siren", Wave.Sawtooth, Attack.Even, Effect.None, 600, 160, 450);
        // angry shout
        defineFlexFX("shout", 120, 125, Wave.Sawtooth, Attack.Fast, Effect.None, 400, 200, 300);
        extendFlexFX("shout", Wave.Sawtooth, Attack.Even, Effect.None, 360, 200, 75);
        extendFlexFX("shout", Wave.Sawtooth, Attack.Even, Effect.None, 120, 187, 125);
        // Approximation to a snore!
        defineFlexFX("snore", 3500, 22, Wave.Noise, Attack.Even, Effect.Vibrato, 700, 222, 500);
        extendFlexFX("snore", Wave.Noise, Attack.Even, Effect.Vibrato, 5000, 222, 500);
        defineFlexFX("tweet", 480, 112, Wave.Sine, Attack.Fast, Effect.None, 600, 250, 700);
        // Violin-like
        defineFlexFX("violin", 4, 200, Wave.Sawtooth, Attack.Fast, Effect.None, 440, 150, 50);
        extendFlexFX("violin", Wave.Sawtooth, Attack.Even, Effect.None, 440, 150, 425);
        extendFlexFX("violin", Wave.Sawtooth, Attack.Even, Effect.None, 44, 200, 25);
        // whale-song
        defineFlexFX("whale", 540, 22, Wave.Square, Attack.Even, Effect.None, 405, 222, 200);
        extendFlexFX("whale", Wave.Square, Attack.Even, Effect.None, 450, 222, 800);
        extendFlexFX("whale", Wave.Square, Attack.Even, Effect.None, 360, 11, 1000);
        // strange breed of dog
        defineFlexFX("woof", 300, 250, Wave.Square, Attack.Even, Effect.None, 100, 225, 30);
        extendFlexFX("woof", Wave.Sawtooth, Attack.Even, Effect.None, 225, 225, 90);       
        extendFlexFX("woof", Wave.Sawtooth, Attack.Even, Effect.None, 225, 225, 90);
        // trouble ahead! (includes a silent gap in the middle)
        defineFlexFX("uhoh", 165, 80, Wave.Sawtooth, Attack.Fast, Effect.None, 180, 200, 200);
        extendFlexFX("uhoh", Wave.Silence, Attack.Even, Effect.None, 142.5, 200, 200);
        extendFlexFX("uhoh", Wave.Square, Attack.Even, Effect.None, 127, 150, 600);

   }

    function populateBuiltInTunes() {
        composeTune("birthday", "2G4 1G4 3A4 3G4 3C5 6B4");    // line 1
        extendTune("birthday", "2G4 1G4 3A4 3G4 3D5 6C5");     // line 2
        extendTune("birthday", "2G4 1G4 3G5 3E5 3C5 3B4 6A4"); // line 3
        extendTune("birthday", "2F5 1F5 3E5 3C5 3D5 6C5");     // line 4
        composeTune("newWorld", "6E3 2G3 8G3 6E3 2D3 8C3"); // line 1
        extendTune("newWorld", "4D3 4E3 4G3 4E3 8D3 8R");   // line 2
        extendTune("newWorld", "6E3 2G3 8G3 6E3 2D3 8C3");  // line 2
        extendTune("newWorld", "4D3 4E3 6D3 2C3 8C3 8R");   // line 2
        composeTune("odeToJoy", "4B4 4B4 4C5 4D5 4D5 4C5 4B4 4A4");     // line 1
        extendTune("odeToJoy", "4G4 4G4 4A4 4B4 6B4 2A4 8A4");         // line 2
        extendTune("odeToJoy", "4B4 4B4 4C5 4D5 4D5 4C5 4B4 4A4");     // line 3
        extendTune("odeToJoy", "4G4 4G4 4A4 4B4 6A4 2G4 8G4");         // line 4
        extendTune("odeToJoy", "4A4 4A4 4B4 4G4 4A4 2B4 2C5 4B4");     // line 5
        extendTune("odeToJoy", "4G4 4A4 2B4 2C5 4B4 4A4 4G4 4A4 4D4"); // line 6
        extendTune("odeToJoy", "8B4 4B4 4C5 4D5 4D5 4C5 4B4 4A4");     // line 7
        extendTune("odeToJoy", "4G4 4G4 4A4 4B4 6A4 2G4 8G4");         // line 8
        composeTune("bachViolin", ""); // line 1
        composeTune("bachViolin", "");  // line 2

    }

    populateBuiltInFlexFXs();
    populateBuiltInTunes();
}
