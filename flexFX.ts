/* FlexFX
While the built-in facilities for creating sound-effects are impressively flexible,
they are insufficiently flexible for some contexts (such as to properly express moods and emotions.)

This extension allows the creation of more complex sounds, that have inflections in both pitch 
and volume. In the context of mood-sounds, this might include a laugh, a moan or an "Uh-oh" that indicates a problem.

To achieve this we have defined a flexible sound-effect class called a "FlexFX", which embodies one or more sound parts 
that play consecutively to give a smoothly varying result. A FlexFX can either be played as defined, 
or its pitch, volume and duration can be independently scaled to suit requirements.

The core microbit function music.playSoundEffect() offers a playInBackground option. Unfortunately, a subsequent 
playSoundEffect() interrupts this, rather than queuing sounds up. 

The FlexFX class therefore implements its own play-list to achieve the queueing of consecutive background sounds.

For the novice, a selection of interesting built-in FlexFX samples (musical or otherwise) are provided.
*/

/* NOTE:    The built-in enums for sound effect parameters are hardly beginner-friendly!
            By renaming them we can expose somewhat simpler concepts, but this only works 
            if we pass them over a function-call as arguments of type: number.
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
    enum Wave {
        //%block="Silence"
        Silence = -1,    // (special case for adding silent gaps) 
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
    enum Attack {
        //% block="Fast"
        Fast = InterpolationCurve.Logarithmic,
        //% block="Medium"
        Medium = InterpolationCurve.Curve,
        //% block="Even"
        Even = InterpolationCurve.Linear,
        //% block="Delayed"
        Delayed = 99 // mapped to Sine or Cosine, depending on slope of profile
    }
    // Simplify (slightly) the selection of modulation-style...
    enum Effect {
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
    enum BuiltInFlexFX {
        //% block="chime"
        CHIME,
        //% block="cry"
        CRY,
        //% block="flute"
        FLUTE,
        //% block="horn"
        HORN,
        //% block="hum"
        HUM,

        //% block="laugh"
        LAUGH,
        //% block="miaow"
        MIAOW,
        //% block="moan"
        MOAN,
        //% block="moo"
        MOO,
        //% block="motor"
        MOTOR,

        //% block="query"
        QUERY,
        //% block="shout"
        SHOUT,
        //% block="siren"
        SIREN,
        //% block="snore"
        SNORE,
        //% block="ting"
        TING,

        //% block="tweet"
        TWEET,
        //% block="uh-oh"
        UHOH,
        //% block="violin"
        VIOLIN,
        //% block="whale"
        WHALE,
        //% block="woof"
        WOOF
    }

    // array of built-in FlexFX ids 
    // **** must precicely match the enum BuiltInFlexFX above ****
    let builtInId: string[] = [
        "chime", "cry", "flute", "horn", "hum",        // [0...4]
        "laugh", "miaow", "moan", "moo", "motor",      // [5...9]
        "query", "shout", "siren", "snore","ting",     // [10...14]
        "tweet", "uh-oh", "violin", "whale", "woof" ]; // [15...19]
    
    const SEMITONE = 1.0594630943593; // = 12th root of 2 (as 12 semitones make an octave, which doubles the frequency)
    
    class Play {   // for now, just a wrapper for the performance...
        parts: SoundExpression[]; // the sound-strings for its several parts
        constructor() {
            this.parts = [];
        }
    }

    // Performances get queued onto the play-list to ensure proper asynchronous sequencing
    let playList: Play[] = [];
    
    // control flags:
    let playerPlaying = false; // a performance is being played
    export function isPlaying(): boolean { return playerPlaying; } // accessor

    let playerActive = false;
    export function isActive(): boolean { return playerActive; } // accessor

    let playerStopped = false; // activation of player inhibited for now
    export function isStopped(): boolean { return playerStopped; } // accessor


    // activity events (for other components to synchronise with)
    const FLEXFX_ACTIVITY_ID = 9050 // TODO: Check (somehow?) that this is a permissable value!
    enum PLAYER {
        STARTING = 1,
        FINISHED = 2,
        ALLPLAYED = 3,
    }
  
    //  array of all defined FlexFX objects (built-in and user-defined)
    let flexFXList: FlexFX[] = [];


/* 
    A FlexFX is a potentially composite sound-effect.
    It can specify several component soundExpressions called "parts" that get played consecutively.
    Each part has a [frequency,volume] start-point and end-point.
    Apart from the first part, the start-point gets inherited from the previous end-point,
    so an n-part FlexFX moves through (n+1)) [frequency,volume] points.
    It is built, one part at a time, using defineFlexFX() followed by zero or more extendFlexFX() calls.
*/

    class FlexFX {
        // properties
        id: string; // identifier
        nParts: number;
        peakVolume: number; // remembers the highest volume in the prototype
        fullDuration: number; // overall cumulative duration of prototype
        pitchProfile: number[];  // contains [nParts + 1] scalable frequencies
        volumeProfile: number[];  // contains [nParts + 1] scalable volumes
        topVolume: number; // remembers the highest volume in the prototype
        durationProfile: number[]; // contains [nParts] scalable durations
        prototype: Play; // contains the [nParts] SoundExpressions forming this flexFX


        constructor(id: string) {
            this.id = id;
            this.initialise();
        }

        initialise() {
            this.nParts = 0;
            this.pitchProfile = [];
            this.volumeProfile = [];
            this.peakVolume = 0;
            this.durationProfile = [];
            this.fullDuration = 0;
            this.prototype = new Play;
        }        
        
        // internal tools...

        protected goodPitch(pitch: number): number {
            return Math.min(Math.max(pitch, 1), 9999);
        }
        protected goodVolume(volume: number): number {
            return Math.min(Math.max(volume, 0), 100);
        }
        protected goodDuration(duration: number): number {
            return Math.min(Math.max(duration, 10), 9999);
        }

        // methods...

        // begin setting up the very first part of a new FlexFX
        startWith(startPitch:number, startVolume: number){
            this.pitchProfile.push(this.goodPitch(startPitch)); // pitchProfile[0]
            let v = this.goodVolume(startVolume);
            this.volumeProfile.push(v);                         // volumeProfile[0]
            this.peakVolume = v; // ...until proven otherwise
        }

        // add the details of the next part (ensuring all parameters are sensible)
        addPart(wave: Wave, attack: Attack, effect: Effect, endPitch: number, endVolume: number, duration: number) {

            this.pitchProfile.push(this.goodPitch(endPitch));
            
            let v = this.goodVolume(endVolume);
            this.volumeProfile.push(v);
            this.peakVolume = Math.max(this.peakVolume, v);

            let d = this.goodDuration(duration);
            this.durationProfile.push(d);
            this.fullDuration += d;

            // turn our enums into simple numbers & create the sound string for this part
            let waveNumber: number = wave;
            let effectNumber: number = effect;
            let attackNumber: number = attack;
            let startPitch = this.pitchProfile[this.nParts];
            let startVolume = this.volumeProfile[this.nParts]
    
            if (wave = Wave.Silence) {
                // ensure this part plays silently, while preserving the end-point of the previous part 
                // and the start-point of any following part
                startVolume = 0;
                endVolume = 0;
                waveNumber = WaveShape.Sine; // irrelevant, as silent!
            }

            let sound = music.createSoundExpression(waveNumber, startPitch, endPitch,
                startVolume, endVolume, duration, effectNumber, attackNumber);

            // add it into the prototype
            this.prototype.parts.push(sound);
            this.nParts++;
        }

        // Create a scaled performance (called a Play) for this FlexFX
        scalePlay(pitchSteps: number, volumeLimit: number, newDuration: number): Play {
            let play = new Play;
            let sound = new soundExpression.Sound;
            let pitchRatio = Math.pow(SEMITONE, pitchSteps); // semitone steps up or down
            let volumeRatio = volumeLimit / this.peakVolume;
            let durationRatio = newDuration / this.fullDuration;
            for (let i = 0; i < this.nParts; i++) {
                sound.src = this.prototype.parts[i].getNotes();
                sound.frequency = this.goodPitch(this.pitchProfile[i] * pitchRatio);
                sound.endFrequency = this.goodPitch(this.pitchProfile[i + 1] * pitchRatio);
                sound.volume = this.goodVolume(this.volumeProfile[i] * volumeLimit);
                sound.endVolume = this.goodVolume(this.volumeProfile[i + 1] * volumeLimit);
                sound.duration = this.goodDuration(this.durationProfile[i] * durationRatio);
                play.parts[i] = new SoundExpression(sound.src);
            }
            return (play);
        }
        
        // Play it as defined
        playFlexFX( wait: boolean = false)
        {
            playList.push(this.prototype);  // unscaled version
            if (wait) { 
                awaitAllFinished() 
            }
        }

        /** scaleFlexFX()  - play a scaled version of this FlexFX
         * @param pitchSteps  - scaling of all pitches in signed semitone steps (may be fractional)
         * @param volumeMax  - maximum volume (0...255) 
         * @param duration  - required overall duration in ms
         * @param wait  - play synchronously if true
        */
        scaleFlexFX(
            pitchSteps: number, 
            volumeMax: number, 
            duration: number,
            wait: boolean = false)
            {   
                playList.push(this.scalePlay(pitchSteps, volumeMax, duration));  // scaled version
            }

        /******************



The extendFlexFX() function can then be called (repeatedly) to add another way-point along the path, 
together with the [wave, attack, effect] timbre-definition and the duration for the next segment, 
continuing seamlessly from where the previous one left off.

*/

    }


    // Store a flexFX (overwriting any previous instance)
    // (When inititalising a built-in FlexFX, <builtIn> must be the BuiltInFlexFX's enum value
    // that indexes its <id> in the BuiltInId[] array. Otherwise, it must be 1000)
        function storeFlexFX(builtIn: number, target: FlexFX) {
        // first delete any existing definition having this id (works even when missing!)
        flexFXList.splice(flexFXList.indexOf(flexFXList.find(i => i.id === target.id), 1), 1); 
        if (builtIn < 1000) {
            target.id = builtInId[builtIn]; // pick up its id
        }
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
            play = playList.shift();
            // flatten the parts[] of sound-strings into a single comma-separated string
            let soundString = "";
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
        if (playList.length == 0) {
             control.raiseEvent(FLEXFX_ACTIVITY_ID, PLAYER.ALLPLAYED);
        } // else we were prematurely stopped
        playerActive = false;
    }

    // ---- UI BLOCKS ----

    /**
     * Perform a FlexFX (built-in)
     * @param choice  - the chosen built-in sound
     * @param 
     */
    //% block="play FlexFX $choice || at pitch $pitch with strength $volume lasting (ms) $duration queued: $background"
    //% group="Playing"
    //% inlineInputMode=inline
    //% expandableArgumentMode="enabled"
    //% weight=300
    //% choice.defl=BuiltInFlexFX.TING
    //% pitch.min=50 pitch.max=2000 pitch.defl=800
    //% vol.min=0 vol.max=255 vol.defl=200
    //% ms.min=0 ms.max=10000 ms.defl=800
    //% background.defl=false
    export function playBuiltInFlexFX(choice: BuiltInFlexFX, pitch: number = 0, volume: number = 0, duration: number = 0, background: boolean = false) {
        
        playFlexFX(builtInId[choice], pitch, volume, duration, background);
    }

    /**
     * Perform a FlexFX (user-created)
     */
    //% block="play FlexFX $id || at pitch $pitch with strength $volume lasting (ms) $duration queued: $background"
    //% group="Playing"
    //% inlineInputMode=inline
    //% expandableArgumentMode="enabled"
    //% weight=310
    //% id.defl="ting"
    //% pitch.min=50 pitch.max=2000 pitch.defl=800
    //% vol.min=0 vol.max=255 vol.defl=200
    //% ms.min=0 ms.max=10000 ms.defl=800
    //% background.defl=false
    export function playFlexFX(id: string, pitch: number = 0, volume: number = 0, duration: number = 0, background: boolean = false) {

        let target: FlexFX = flexFXList.find(i => i.id === id);
        if (target != null) {
            // first compile and add our Play onto the playList
            target.scalePlay(pitch, volume, duration);  
            // make sure it will get played
            awaitAllFinished();
            /***
            activatePlayer();
            if (!background) { // ours was the lastest Play, so simply await completion of player.
                control.waitForEvent(FLEXFX_ACTIVITY_ID, PLAYER.ALLPLAYED);
            }
            ***/
        }
    }

    /**
     * Await start of next FLexFX on the play-list
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
            activatePlayer(); // it case it wasn't
            control.waitForEvent(FLEXFX_ACTIVITY_ID, PLAYER.ALLPLAYED);
        } // else nothing to wait for
    }

    /**
     * Add a silent pause to the play-list
     */
    //% block="add a pause of $ms ms next in the play-list"
    //% group="Play-list"
    //% weight=240
    export function playSilence(ms: number) {
        let play = new Play;
        play.parts.push("s" + convertToText(Math.floor(ms)));
        playList.push(play);
        activatePlayer();  // make sure it gets played
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
. 
     * @param id  - the identifier of the flexFX to be created or changed
     * @param startPitch  - the initial frequency of the sound (in Hz)
     * @param startVolume  - the initial volume of the sound (0 to 255)
     * @param wave  - chooses the wave-form that characterises this sound
     * @param attack  - chooses how fast the sound moves from its initial to final pitch
     * @param effect  - chooses a possible modification to the sound, such as vibrato
     * @param endPitch  - the final frequency of the sound (in Hz)
     * @param endVolume  - the final volume of the sound (0 to 255)
     * @param duration  - the duration of the sound (in ms) 
     */

    //% block="define FlexFX: $id| using wave-shape $wave|      with attack $attack|       and effect $effect|  pitch profile goes from $startPitch|                       to $endPitch|volume profile goes from $startVolume|                       to $endVolume|default    pitch=$pitch|default   volume=$volume|default duration=$duration"
    //% group="Creating"
    //% inlineInputMode=external
    //% advanced=true
    //% weight=130
    //% id.defl="new"
    //% startPitch.min=25 startPitch.max=400 startPitch.defl=100
    //% startVolume.min=0 startVolume.max=100 startVolume.defl=100
    //% endPitch.min=10 endPitch.max=400 endPitch.defl=100
    //% endVolume.min=0 endVolume.max=100 endVolume.defl=100
    //% duration.min=0 duration.max=10000 duration.defl=800

    export function defineFlexFX(
        id: string, startPitch: number, startVolume: number,
        wave: Wave, attack: Attack, effect: Effect, endPitch: number, endVolume: number,
        duration: number, builtIn: number = 1000) {
        // are we re-defining an existing flexFX?
        let target: FlexFX = flexFXList.find(i => i.id === id);
        if (target != null) {
            target.initialise(); // yes, so clear it down
        } else {
            target = new FlexFX(id);    // no, so get a new one
        }
        target.startWith(startPitch, startVolume);
        target.addPart(wave, attack, effect, endPitch, endVolume, duration)
        storeFlexFX(builtIn, target);
    }

    /**
     * Add another part to an existing FlexFX, continuing from its current final frequency and volume.
     * 
     * @param id  - the identifier of the flexFX to be extended
     * @param wave  - chooses the wave-form that characterises this next part
     * @param attack  - chooses how fast this part moves from its initial to final pitch
     * @param effect  - chooses a possible modification to this part, such as vibrato
     * @param endPitch  - the new final frequency of the FlexFX (in Hz)
     * @param endVolume  - the new final volume of the FlexFX (0 to 255)
     * @param duration  - the additional duration of this new part (in ms)
     */

    //% block="continue FlexFX: $id| using wave-shape $wave|      with attack $attack|       and effect $effect|  pitch profile goes to $endPitch|volume profile goes to $endVolume| duration extended by (ms) $duration"
    //% group="Creating"
    //% inlineInputMode=external
    //% advanced=true
    //% weight=130
    //% id.defl="new"
    //% endPitch.min=10 endPitch.max=400 endPitch.defl=100
    //% endVolume.min=0 endVolume.max=100 endVolume.defl=100
    //% duration.min=0 duration.max=10000 duration.defl=800

    export function extendFlexFX(
        id: string,
        wave: Wave, attack: Attack, effect: Effect, endPitch: number, endVolume: number,
        duration: number, builtIn: number = 1000) {

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
            target.pitchProfile.push(endPitch);
            target.volumeProfile.push(endVolume);
            target.durationProfile.push(duration);
            // create the sound string for the next part of the prototype 
            let sound = music.createSoundExpression(waveNumber, this.pitchProfile[this.nParts], endPitch, 
                                this.volumeProfile[this.nParts], endVolume, duration, effectNumber, attackNumber);
            target.prototype.parts.push(sound);
        }
        storeFlexFX(builtIn, target);
    }

    // Populate the FlexFX array with the selection of built-in sounds
    function populateBuiltIns() {
        // simple "ting"
        defineFlexFX("TING", Wave.Triangle, 2000, 2000, 255, 25, 200,
            Effect.None, Attack.Fast);

        // a little birdie
        defineFlexFX("TWEET", Wave.Sine, 480, 600, 112, 250, 700,
            Effect.None, Attack.Fast);

        // chime effect
        defineFlexFX("CHIME", Wave.Sine, 315, 300, 200, 100, 400,
            Effect.None, Attack.Fast);
        extendFlexFX("CHIME", Wave.Sine, 300, 100, 0,
            Effect.None, Attack.Even);

        // French Horn (-ish)
        defineFlexFX("HORN", Wave.Sawtooth, 12, 250, 127, 255, 35,
            Effect.None, Attack.Fast);
        extendFlexFX("HORN", Wave.Sine, 250, 255, 0,
            Effect.None, Attack.Even);

        // a gentle hum...
        defineFlexFX("HUM", Wave.Sawtooth, 750, 250, 80, 90, 30,
            Effect.None, Attack.Fast);
        extendFlexFX("HUM", Wave.Square, 250, 90, 0,
            Effect.None, Attack.Even);

        // single laugh (repeat for giggles)
        defineFlexFX("LAUGH", Wave.Sawtooth, 280, 400, 100, 250, 450,
            Effect.None, Attack.Fast);
        extendFlexFX("LAUGH", Wave.Square, 280, 250, 0,
            Effect.None, Attack.Even);

        // somewhat cat-like
        defineFlexFX("MIAOW", Wave.Sawtooth, 630, 900, 127, 255, 300,
            Effect.None, Attack.Even);
        extendFlexFX("MIAOW", Wave.Sawtooth, 810, 255, 0,
            Effect.None, Attack.Even);

        // somewhat cow-like
        defineFlexFX("MOO", Wave.Sawtooth, 98, 140, 160, 200, 600,
            Effect.None, Attack.Even);
        extendFlexFX("MOO", Wave.Sawtooth, 98, 200, 0,
            Effect.None, Attack.Even);

        // engine-noise (kind-of)
        defineFlexFX("MOTOR", Wave.Sawtooth, 105, 150, 240, 200, 450,
            Effect.Tremolo, Attack.Fast);
        extendFlexFX("MOTOR", Wave.Sawtooth, 120, 200, 0,
            Effect.Tremolo, Attack.Even);

        // questioning...
        defineFlexFX("QUERY", Wave.Square, 330, 300, 50, 250, 180,
            Effect.None, Attack.Even);
        extendFlexFX("QUERY", Wave.Square, 450, 250, 0,
            Effect.None, Attack.Even);

        // Approximation to a snore!
        defineFlexFX("SNORE", Wave.Noise, 3500, 700, 22, 222, 500,
            Effect.Vibrato, Attack.Even);
        extendFlexFX("SNORE", Wave.Noise, 5000, 222, 0,
            Effect.Vibrato, Attack.Even);

        // wailing sound
        defineFlexFX("CRY", Wave.Square, 200, 800, 125, 250, 264,
            Effect.None, Attack.Even);
        extendFlexFX("CRY", Wave.Square, 400, 250, 264,
            Effect.None, Attack.Even);
        extendFlexFX("CRY", Wave.Square, 600, 125, 272,
            Effect.None, Attack.Even);






        // sad whimpering moan
        defineFlexFX("MOAN", Wave.Triangle, 540, 450, 90, 150, 420,
            Effect.None, Attack.Even);
        extendFlexFX("MOAN", Wave.Triangle, 427, 150, 210,
            Effect.None, Attack.Even);
        extendFlexFX("MOAN", Wave.Triangle, 517, 82, 70,
            Effect.None, Attack.Even);

        // angry shout
        defineFlexFX("SHOUT", Wave.Sawtooth, 120, 400, 125, 200, 300,
            Effect.None, Attack.Fast);
        extendFlexFX("SHOUT", Wave.Sawtooth, 360, 200, 75,
            Effect.None, Attack.Even);
        extendFlexFX("SHOUT", Wave.Sawtooth, 120, 187, 125,
            Effect.None, Attack.Even);

        // Violin-like
        defineFlexFX("VIOLIN", Wave.Sawtooth, 4, 440, 200, 150, 50,
            Effect.None, Attack.Fast);
        extendFlexFX("VIOLIN", Wave.Sawtooth, 440, 150, 425,
            Effect.None, Attack.Even);
        extendFlexFX("VIOLIN", Wave.Sawtooth, 44, 200, 25,
            Effect.None, Attack.Even);

        // whale-song
        defineFlexFX("WHALE", Wave.Square, 540, 405, 22, 222, 200,
            Effect.None, Attack.Even);
        extendFlexFX("WHALE", Wave.Square, 450, 222, 800,
            Effect.None, Attack.Even);
        extendFlexFX("WHALE", Wave.Square, 360, 11, 1000,
            Effect.None, Attack.Even);

        // strange breed of dog
        defineFlexFX("WOOF", Wave.Square, 300, 100, 250, 225, 30,
            Effect.None, Attack.Even);
        extendFlexFX("WOOF", Wave.Sawtooth, 225, 225, 90,
            Effect.None, Attack.Even);
        extendFlexFX("WOOF", Wave.Sawtooth, 300, 125, 180,
            Effect.None, Attack.Even);

        // breathy flute
        defineFlexFX("FLUTE", Wave.Noise, 25, 262, 250, 250, 75,
            Effect.Vibrato, Attack.Fast);
        extendFlexFX("FLUTE", Wave.Triangle, 2250, 250, 1200,
            Effect.None, Attack.Fast);
        extendFlexFX("FLUTE", Wave.Triangle, 200, 0, 225,
            Effect.None, Attack.Even);

        // Police siren (nee-naw) (middle part is silent)
        defineFlexFX("SIREN", Wave.Sawtooth, 760, 800, 160, 200, 450,
            Effect.None, Attack.Even);
        // (add a silent gap in the middle)
        extendFlexFX("SIREN", Wave.Sine, 0, 0, 100,
            Effect.None, Attack.Even);
        extendFlexFX("SIREN", Wave.Sawtooth, 600, 160, 450,
            Effect.None, Attack.Even);

        // trouble ahead!
        defineFlexFX("UHOH", Wave.Sawtooth, 165, 180, 80, 200, 200,
            Effect.None, Attack.Fast);
        // (add a silent gap in the middle)
        extendFlexFX("UHOH", Wave.Silence, 0, 0, 200,
            Effect.None, Attack.Even);
        extendFlexFX("UHOH", Wave.Square, 127, 150, 600,
            Effect.None, Attack.Even);

    /**** Old definitions...
        // chime effect
        flexFX.create2PartFlexFX("", 105, 100,
            Wave.SINE, Attack.FAST, Effect.NONE, 100, 50,
            Wave.SINE, Attack.SLOW, Effect.NONE, 100, 10, 20,
            300, 200, 2000,BuiltInFlexFX.CHIME)

        // create a wailing 3-part flexFX
        flexFX.create3PartFlexFX("", 50, 50,
            Wave.SQUARE, Attack.SLOW, Effect.NONE, 200, 100,
            Wave.SQUARE, Attack.SLOW, Effect.NONE, 100, 100,
            Wave.SQUARE, Attack.SLOW, Effect.NONE, 150, 50, 33, 33,
            400, 250, 800, BuiltInFlexFX.CRY);

        // breathy flute
        flexFX.create3PartFlexFX(
            "", 10, 100,
            Wave.NOISE, Attack.FAST, Effect.VIBRATO, 105, 100,
            Wave.TRIANGLE, Attack.FAST, Effect.NONE, 100, 30,
            Wave.TRIANGLE, Attack.SLOW, Effect.NONE, 80, 0,
            5, 80, 250, 250, 1500, BuiltInFlexFX.FLUTE);

        // Horn 2-part flexFX
        flexFX.create2PartFlexFX("", 5, 50,
            Wave.SAWTOOTH, Attack.FAST, Effect.NONE, 100, 100,
            Wave.SINE, Attack.SLOW, Effect.NONE, 100, 80, 7,
            250, 255, 500, BuiltInFlexFX.HORN);

        // a gentle hum...
        flexFX.create2PartFlexFX("", 300, 80,
            Wave.SAWTOOTH, Attack.FAST, Effect.NONE, 100, 90,
            Wave.SQUARE, Attack.SLOW, Effect.NONE, 100, 70, 5,
            250, 100, 600, BuiltInFlexFX.HUM);

        // single laugh (repeat for giggles)
        flexFX.create2PartFlexFX("", 70, 40,
            Wave.SAWTOOTH, Attack.FAST, Effect.NONE, 100, 100,
            Wave.SQUARE, Attack.SLOW, Effect.NONE, 70, 75, 90,
            400, 250, 500, BuiltInFlexFX.LAUGH);

        // cat-like 2-part flexFX
        flexFX.create2PartFlexFX("", 70, 50,
            Wave.SAWTOOTH, Attack.MEDIUM, Effect.NONE, 100, 100,
            Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 90, 80, 30,
            900, 255, 1000, BuiltInFlexFX.MIAOW);

        // sad whimpering moan
        flexFX.create3PartFlexFX("", 120, 60,
            Wave.TRIANGLE, Attack.MEDIUM, Effect.NONE, 100, 100,
            Wave.TRIANGLE, Attack.MEDIUM, Effect.NONE, 95, 80,
            Wave.TRIANGLE, Attack.SLOW, Effect.NONE, 115, 55, 60, 30,
            450, 150, 700, BuiltInFlexFX.MOAN);

        // moo like a cow
        flexFX.create2PartFlexFX("", 70 ,80,
            Wave.SAWTOOTH, Attack.MEDIUM, Effect.NONE, 100, 100,
            Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 70, 30, 40,
            140, 200, 1500, BuiltInFlexFX.MOO);

        // engine-noise (kind-of)
        flexFX.create2PartFlexFX("", 70, 120,
            Wave.SAWTOOTH, Attack.FAST, Effect.TREMOLO, 100, 100,
            Wave.SAWTOOTH, Attack.SLOW, Effect.TREMOLO, 80, 50, 15,
            150, 200, 3000,BuiltInFlexFX.MOTOR);

        // questioning...
        flexFX.create2PartFlexFX("", 110, 20,
            Wave.SQUARE, Attack.SLOW, Effect.NONE, 100, 100,
            Wave.SQUARE, Attack.MEDIUM, Effect.NONE, 150, 30, 20,
            300, 250, 900, BuiltInFlexFX.QUERY);

        // angry shout
        flexFX.create3PartFlexFX("", 30, 50,
            Wave.SAWTOOTH, Attack.FAST, Effect.NONE, 100, 80,
            Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 90, 100,
            Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 30, 75, 60, 15,
            400, 250, 500, BuiltInFlexFX.SHOUT);

        // Police siren is a double flexFX
        flexFX.createDoubleFlexFX("",
            95, 80, Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 100, 100,
            70, 100, Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 75, 80, 45, 10,
            800, 200, 1000, BuiltInFlexFX.SIREN);

        // Approximation to a snore!
        flexFX.create2PartFlexFX("", 7000, 10,
            Wave.NOISE, Attack.SLOW, Effect.VIBRATO, 1400, 100,
            Wave.NOISE, Attack.SLOW, Effect.VIBRATO, 9999, 0, 50,
            50, 222, 1000, BuiltInFlexFX.SNORE);

        // simple "ting" flexFX
        flexFX.defineFlexFX("", 100, 100, Wave.TRIANGLE, Attack.FAST, Effect.NONE, 100, 10,
            2000, 255, 200, BuiltInFlexFX.TING);

        // tweet
        flexFX.defineFlexFX("", 80, 45,
            Wave.SINE, Attack.FAST, Effect.NONE, 100, 100,
            600, 250, 700, BuiltInFlexFX.TWEET);

        // trouble ahead!
        flexFX.createDoubleFlexFX("",
            110, 40, Wave.SAWTOOTH, Attack.FAST, Effect.NONE, 120, 100,
            95, 100, Wave.SQUARE, Attack.SLOW, Effect.NONE, 85, 75, 20, 20,
            150, 200, 1000, BuiltInFlexFX.UHOH);

        // Violin-like 3-part flexFX
        flexFX.create3PartFlexFX("", 1, 100,
            Wave.SAWTOOTH, Attack.FAST, Effect.NONE, 100, 75,
            Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 100, 75,
            Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 10, 100, 10, 85,
            440, 200, 500, BuiltInFlexFX.VIOLIN);

        // whale-song
        flexFX.create3PartFlexFX("", 120, 10,
            Wave.SQUARE, Attack.MEDIUM, Effect.NONE, 90, 100,
            Wave.SQUARE, Attack.SLOW, Effect.NONE, 100, 60,
            Wave.SQUARE, Attack.SLOW, Effect.NONE, 80, 5, 10, 40,
            450, 222, 2000, BuiltInFlexFX.WHALE);

        // strange breed of dog
        flexFX.create3PartFlexFX("", 120, 100,
            Wave.SQUARE, Attack.MEDIUM, Effect.NONE, 40, 90,
            Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 90, 100,
            Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 120, 50,
            10, 30, 250, 250, 300, BuiltInFlexFX.WOOF);
    ******/
    }

    populateBuiltIns();
}
