/* FlexFX
While the built-in facilities for creating sound-effects are impressively flexible,
they are insufficiently flexible for some contexts (such as to properly express moods and emotions.)

This extension allows the creation of more complex sounds, that have inflections in both pitch 
and volume. In the context of mood-sounds, this might include a laugh, a moan or an "Uh-oh" that indicates a problem.

To achieve this we have defined a flexible sound-effect class called a "FlexFX", which contains the recipe 
to compile a composite sound string involving up to three separate sound parts that will then be played
consecutively to give a smoothly varying result when spliced together.

The core function to playSoundEffect() offers a playInBackground option. Unfortunately, this 
does not allow a subsequent playSoundEffect() to queue sounds up. The FlexFX class therefore
implements its own play-list to achieve this.

*/
/* NOTE:    The built-in enums for sound effect parameters are hardly beginner-friendly!
            By renaming them we can expose somewhat simpler concepts, but this only works 
            if we pass them over a function-call as arguments of type: number.
*/


/**
 * Tools for creating composite sound-effects of class FlexFX that can be performed 
 * (either directly or queued-up) with dynamically-specified pitch, volume and duration.
 */

//% color=#70e030
//% icon="\uf0a1"
//% block="FlexFX"
//% groups="['Playing', 'Play-list', 'Creating']"
namespace flexFX {  

    // Simplify the selection of wave-shape...
    enum Wave {
        //%block="Pure"
        Sine = WaveShape.Sine,
        //%block="Buzzy"
        SQUARE = WaveShape.Square,
        //%block="Bright"
        TRIANGLE = WaveShape.Triangle,
        //%block="Harsh"
        SAWTOOTH = WaveShape.Sawtooth,
        //%block="Noisy"
        NOISE = WaveShape.Noise
    }
    // Simplify the selection of frequency interpolation trajectory...
    enum Attack {
        //% block="Slow"
        SLOW = InterpolationCurve.Linear,
        //% block="Medium"
        MEDIUM = InterpolationCurve.Curve,
        //% block="Fast"
        FAST = InterpolationCurve.Logarithmic
    }
    // Simplify (slightly) the selection of modulation-style...
    enum Effect {
        //% block="None"
        NONE = SoundExpressionEffect.None,
        //% block="Vibrato"
        VIBRATO = SoundExpressionEffect.Vibrato,
        //% block="Tremolo"
        TREMOLO = SoundExpressionEffect.Tremolo,
        //% block="Warble"
        WARBLE = SoundExpressionEffect.Warble
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
        parts: SoundExpression[]; // the "compiled" sound-strings for its several parts
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


    // A FlexFX contains the recipe to compile a composite sound.
    // It can specify several component soundExpressions called "parts" that get played consecutively.
    // Each part has a [frequency,volume] start-point and end-point.
    // Apart from the first part, the start-point is inherited from the previous end-point,
    // so an n-part FlexFX moves through (n+1)) [frequency,volume] points

    class FlexFX {
        // properties
        id: string; // identifier
        nParts: number;
        pitchProfile: number[];  // contains [nParts + 1] scalable frequencies
        volumeProfile: number[];  // contains [nParts + 1] scalable volumes
        durationProfile: number[]; // contains [nParts] scalable durations
        prototype: Play; // contains the [nParts] SoundExpressions forming this flexFX


        constructor(id: string) {
            this.id = id;
            this.nParts = 0;
            this.pitchProfile = [];
            this.volumeProfile = [];
            this.durationProfile = [];
            this.prototype = new Play;
        }

        // internal tools...
        protected goodFreqRatio(freq: number): number{
            return Math.min(Math.max(freq, 0), 2000);
        }
        protected goodVolRatio(vol: number): number {
            return Math.min(Math.max(vol, 0), 100);
        }
        protected goodTimeRatio(time: number, timeLeft: number): number {
            return Math.min(Math.max(time, 0), timeLeft);
        }

        /* possible benefit/efficiencies in flattening parts[] into a single comma-separated string?
        protected extend(base: SoundExpression, extension: SoundExpression): SoundExpression {
            let sound = new soundExpression.Sound();
            sound.src = base.getNotes() + "," + extension.getNotes();
            return new SoundExpression(sound.src);
        }
        */

        // methods...  

        // Create a scaled performance (called a Play) for this FlexFX
        createPlay(pitchSteps: number, volumeRatio: number, durationRatio: number): Play {
            let play = new Play;
            let sound = new soundExpression.Sound;
            let pitchRatio = Math.pow(SEMITONE, pitchSteps); // semitone steps up or down
            for (let i = 0; i < this.nParts; i++) {
                sound.src = this.prototype.parts[i].getNotes();
                sound.frequency = this.pitchProfile[i] * pitchRatio;
                sound.endFrequency = this.pitchProfile[i + 1] * pitchRatio;
                sound.volume = this.volumeProfile[i] * volumeRatio;
                sound.endVolume = this.volumeProfile[i + 1] * volumeRatio;
                sound.duration = this.durationProfile[i] * durationRatio;
                play.parts[i] = new SoundExpression(sound.src);
            }
            return (play);
        }
        
        // Play it as defined
        playFlexFX(
             // id: string,unique identifier
            wait: boolean = false) // play synchronously if true
            {
                playList.push(this.prototype);  // unscaled veraion
            }

        // play a scaled version
        scaleFlexFX(
           // id: string,  unique identifier
            pitchSteps: number, // scaling of all pitches in signed semitone steps (may be fractional)
            volumeMax: number, // maximum volume (0...255) 
            duration: number, // new overall duration in ms
            wait: boolean = false) // play synchronously if true
            {   
                playList.push(createPlay(pitchSteps,volumeMax,duration);  // unscaled veraion
            }

        /******************

The defineFlexFX() function sets up the initial base-point of the sonic path, together with the path; 
the [wave, attack, effect] timbre-definition; and the duration for the first segment.

The extendFlexFX() function can then be called (repeatedly) to add another way-point along the path, 
together with the [wave, attack, effect] timbre-definition and the duration for the next segment, 
continuing seamlessly from where the previous one left off.

*/

    }


    // Store a flexFX (overwriting any previous instance)
    // (When inititalising a built-in FlexFX, <builtIn> must be the BuiltInFlexFX
    // enum value that indexes its <id> in the BuiltInId[] array. Otherwise, it must be 1000)
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

    // play everything on the playList in turn
    function player() {
        let play = new Play;
        while ((playList.length > 0) && !playerStopped) { 
            play = playList.shift();
            control.raiseEvent(FLEXFX_ACTIVITY_ID, PLAYER.STARTING);
            playerPlaying = true;
            while (play.parts.length > 0) {  // play its SoundExpressions in turn
                music.playSoundEffect(play.parts.shift().getNotes(), SoundExpressionPlayMode.UntilDone)
            }
            control.raiseEvent(FLEXFX_ACTIVITY_ID, PLAYER.FINISHED);
            playerPlaying = false;
        }
        if (playList.length == 0) {
             control.raiseEvent(FLEXFX_ACTIVITY_ID, PLAYER.ALLPLAYED);
        } // else we were prematurely stopped
        playerActive = false;
    }

    // ---- UI BLOCKS ----

    /**
     * Perform a FlexFX (built-in)
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
            target.compilePlay(pitch, volume, duration);
            activatePlayer();  // make sure it will get played
            if (!background) { // ours was the lastest Play, so simply await completion of player.
                control.waitForEvent(FLEXFX_ACTIVITY_ID, PLAYER.ALLPLAYED);
            }
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
     * Create a simple custom FlexFX 
     */
    //% block="create simple FlexFX: $id| using wave-shape $wave|      with attack $attack|       and effect $effect|  pitch profile goes from $startPitchPercent|                       to $endPitchPercent|volume profile goes from $startVolPercent|                       to $endVolPercent|default    pitch=$pitch|default   volume=$volume|default duration=$duration"
    //% group="Creating"
    //% inlineInputMode=external
    //% advanced=true
    //% weight=130
    //% id.defl="simple"
    //% startPitchPercent.min=25 startPitchPercent.max=400 startPitchPercent.defl=100
    //% startVolPercent.min=0 startVolPercent.max=100 startVolPercent.defl=100
    //% endPitchPercent.min=10 endPitchPercent.max=400 endPitchPercent.defl=100
    //% endVolPercent.min=0 endVolPercent.max=100 endVolPercent.defl=100
    //% pitch.min=50 pitch.max=2000 pitch.defl=800
    //% volume.min=0 volume.max=255 volume.defl=200
    //% duration.min=0 duration.max=10000 duration.defl=800
    export function createFlexFX(
        id: string, startPitchPercent: number, startVolPercent: number,
        wave: Wave, attack: Attack, effect: Effect, endPitchPercent: number, endVolPercent: number,
        pitch: number, volume: number, duration: number, builtIn: number = 1000) {
        let target = new FlexFX(id);
        target.setPartA(startPitchPercent / 100, startVolPercent / 100, wave, attack, effect, endPitchPercent / 100, endVolPercent / 100, 1.0);
        target.setDefaults(pitch,volume,duration);
        storeFlexFX(builtIn, target);
    }

    /**
     * Create a more complex two-part custom FlexFX 
     */
    //% block="create 2-part FlexFX: $id| first using wave-shape $waveA            with attack $attackA             and effect $effectA|  then using wave-shape $waveB            with attack $attackB             and effect $effectB|  pitch profile goes from $startPitchPercent                       to $midPitchPercent                       to $endPitchPercent|volume profile goes from $startVolPercent                       to $midVolPercent                       to $endVolPercent|duration used for 1st part: $timePercentA|default    pitch=$pitch|default   volume=$volume|default duration=$duration"
    //% group="Creating"
    //% inlineInputMode=external
    //% weight=120
    //% advanced=true
    //% id.defl="2-part"
    //% startPitchPercent.min=10 startPitchPercent.max=400 startPitchPercent.defl=100
    //% startVolPercent.min=0 startVolPercent.max=100 startVolPercent.defl=100
    //% midPitchPercent.min=10 midPitchPercent.max=400 midPitchPercent.defl=100
    //% midVolPercent.min=0 midVolPercent.max=100 midVolPercent.defl=100
    //% endPitchPercent.min=10 endPitchPercent.max=400 endPitchPercent.defl=100
    //% endVolPercent.min=0 endVolPercent.max=100 endVolPercent.defl=100
    //% timePercentA.min=0 timePercentA.max=100 timePercentA.defl=50
    //% pitch.min=50 pitch.max=2000 pitch.defl=800
    //% volume.min=0 volume.max=255 volume.defl=200
    //% duration.min=0 duration.max=10000 duration.defl=800
    export function create2PartFlexFX(
        id: string, startPitchPercent: number, startVolPercent: number,
        waveA: Wave, attackA: Attack, effectA: Effect, midPitchPercent: number, midVolPercent: number,
        waveB: Wave, attackB: Attack, effectB: Effect, endPitchPercent: number, endVolPercent: number, timePercentA: number,
        pitch: number, volume: number, duration: number, builtIn: number = 1000) {
        let target = new FlexFX(id);
        target.setPartA(startPitchPercent / 100, startVolPercent / 100, waveA, attackA, effectA, midPitchPercent / 100, midVolPercent / 100, timePercentA / 100);
        target.setPartB(waveB, attackB, effectB, endPitchPercent / 100, endVolPercent / 100,
            (100 - timePercentA / 100));
        target.setDefaults(pitch, volume, duration);
        storeFlexFX(builtIn, target);
    }

    /**
     * Create a really complex three-part custom FlexFX 
     */
    //% block="create 3-part FlexFX: $id|  first using wave-shape $waveA             with attack $attackA              and effect $effectA|   then using wave-shape $waveB             with attack $attackB              and effect $effectB|lastly using wave-shape $waveC             with attack $attackC              and effect $effectC|  pitch profile goes from $startPitchPercent                       to $pitchABPercent                       to $pitchBCPercent                       to $endPitchPercent|volume profile goes from $startVolPercent                       to $volABPercent                       to $volBCPercent                       to $endVolPercent|duration used for 1st part:$timePercentA|                   2nd part: $timePercentB|default    pitch=$pitch|default   volume=$volume|default duration=$duration"
    //% group="Creating"
    //% inlineInputMode=external
    //% weight=110
    //% advanced=true
    //% id.defl="3-part"
    //% startPitchPercent.min=10 startPitchPercent.max=400 startPitchPercent.defl=100
    //% startVolPercent.min=0 startVolPercent.max=100 startVolPercent.defl=100
    //% pitchABPercent.min=10 pitchABPercent.max=400 pitchABPercent.defl=100
    //% volABPercent.min=0 volABPercent.max=100 volABPercent.defl=100
    //% pitchBCPercent.min=10 pitchBCPercent.max=400 pitchBCPercent.defl=100
    //% volBCPercent.min=0 volBCPercent.max=100 volBCPercent.defl=100
    //% endPitchPercent.min=10 endPitchPercent.max=400 endPitchPercent.defl=100
    //% endVolPercent.min=0 endVolPercent.max=100 endVolPercent.defl=100
    //% timePercentA.min=0 timePercentA.max=100 timePercentA.defl=33
    //% timePercentB.min=0 timePercentB.max=100 timePercentB.defl=33
    //% pitch.min=50 pitch.max=2000 pitch.defl=800
    //% volume.min=0 volume.max=255 volume.defl=200
    //% duration.min=0 duration.max=10000 duration.defl=800
    export function create3PartFlexFX(
        id: string, startPitchPercent: number, startVolPercent: number,
        waveA: Wave, attackA: Attack, effectA: Effect, pitchABPercent: number, volABPercent: number,
        waveB: Wave, attackB: Attack, effectB: Effect, pitchBCPercent: number, volBCPercent: number,
        waveC: Wave, attackC: Attack, effectC: Effect, endPitchPercent: number, endVolPercent: number,
        timePercentA: number, timePercentB: number,
        pitch: number, volume: number, duration: number, builtIn: number = 1000) {
        let target = new FlexFX(id);
        target.setPartA(startPitchPercent / 100, startVolPercent / 100, waveA, attackA, effectA, pitchABPercent / 100, volABPercent / 100, timePercentA / 100);
        target.setPartB(waveB, attackB, effectB, pitchBCPercent / 100, volBCPercent / 100, timePercentB / 100);
        target.setPartC(waveC, attackC, effectC, endPitchPercent / 100, endVolPercent / 100, (100 - timePercentA - timePercentB) / 100);
        target.setDefaults(pitch, volume, duration);
        storeFlexFX(builtIn, target);
    }

    /**
     * Create a FlexFx with two parts separated by a silence.
    */
    // NOTE: Since it's the second actual sound, PartC is called PartB in the UI
    //% block="create double FlexFX: $id|1st part using wave-shape $waveA               with attack $attackA                and effect $effectA|  pitch profile goes from $startPitchAPercent                       to $endPitchAPercent|volume profile goes from $startVolAPercent                       to $endVolAPercent|duration used for 1st part:$timePercentA|duration used for silence:  $timeGapPercent|2nd part using wave-shape $waveB               with attack $attackB                and effect $effectB|  pitch profile goes from $startPitchBPercent                       to $endPitchBPercent|volume profile goes from $startVolBPercent                       to $endVolBPercent|default    pitch=$pitch|default   volume=$volume|default duration=$duration"
    //% group="Creating"
    //% help=pxt-flexfx/createDoubleFlexFX
    //% inlineInputMode=external
    //% weight=100
    //% advanced=true
    //% id.defl="double"
    //% startPitchAPercent.min=10 startPitchAPercent.max=400 startPitchAPercent.defl=100
    //% startVolAPercent.min=0 startVolAPercent.max=100 startVolAPercent.defl=100
    //% endPitchAPercent.min=10 endPitchAPercent.max=400 endPitchAPercent.defl=100
    //% endVolAPercent.min=0 endVolAPercent.max=100 endVolAPercent.defl=100
    //% startPitchBPercent.min=10 startPitchBPercent.max=400 startPitchBPercent.defl=75
    //% startVolBPercent.min=0 startVolBPercent.max=100 startVolBPercent.defl=100
    //% endPitchBPercent.min=10 endPitchBPercent.max=400 endPitchBPercent.defl=75
    //% endVolBPercent.min=0 endVolBPercent.max=100 endVolBPercent.defl=100
    //% timePercentA.min=0 timePercentA.max=100 timePercentA.defl=40
    //% timeGapPercent.min=0 timeGapPercent.max=100 timeGapPercent.defl=20
    //% pitch.min=50 pitch.max=2000 pitch.defl=800
    //% volume.min=0 volume.max=255 volume.defl=200
    //% duration.min=0 duration.max=10000 duration.defl=800
    export function createDoubleFlexFX(
        id: string, startPitchAPercent: number, startVolAPercent: number,
        waveA: Wave, attackA: Attack, effectA: Effect, endPitchAPercent: number, endVolAPercent: number,
        startPitchBPercent: number, startVolBPercent: number,
        waveB: Wave, attackB: Attack, effectB: Effect, endPitchBPercent: number, endVolBPercent: number,
        timePercentA: number, timeGapPercent: number,
        pitch: number, volume: number, duration: number, builtIn: number = 1000) {
        let target = new FlexFX(id);
        target.setPartA(startPitchAPercent / 100, startVolAPercent / 100, waveA, attackA, effectA, endPitchAPercent / 100, endVolAPercent / 100, timePercentA / 100);
        target.silentPartB(startPitchBPercent / 100, startVolBPercent / 100, timeGapPercent / 100);
        target.setPartC(waveB, attackB, effectB, endPitchBPercent / 100, endVolBPercent / 100, (100 - timePercentA - timeGapPercent) / 100);
        target.setDefaults(pitch, volume, duration);
        storeFlexFX(builtIn, target);
    }

// Populate the FlexFX array with a selection of built-in sounds

    // simple "ting"
    createFlexFX("TING", WaveShape.Triangle, 2000, 2000, 255, 25.5, 0,
        SoundExpressionEffect.None, InterpolationCurve.Logarithmic);

    // a little birdie
    createFlexFX("TWEET", WaveShape.Sine, 480, 600, 112.5, 250, 0,
        SoundExpressionEffect.None, InterpolationCurve.Logarithmic);

    // chime effect
    createFlexFX("CHIME", WaveShape.Sine, 315, 300, 200, 100, 400,
        SoundExpressionEffect.None, InterpolationCurve.Logarithmic);
    extendFlexFX("CHIME", WaveShape.Sine, 300, 300, 200, 100, 0,
        SoundExpressionEffect.None, InterpolationCurve.Linear);

    // French Horn (-ish)
    createFlexFX("HORN", WaveShape.Sawtooth, 12.5, 250, 127.5, 255, 35,
        SoundExpressionEffect.None, InterpolationCurve.Logarithmic);
    extendFlexFX("HORN", WaveShape.Sine, 250, 250, 127.5, 255, 0,
        SoundExpressionEffect.None, InterpolationCurve.Linear);

    // a gentle hum...
    createFlexFX("HUM", WaveShape.Sawtooth, 750, 250, 80, 90, 30,
        SoundExpressionEffect.None, InterpolationCurve.Logarithmic);
    extendFlexFX("HUM", WaveShape.Square, 250, 250, 80, 90, 0,
        SoundExpressionEffect.None, InterpolationCurve.Linear);

    // single laugh (repeat for giggles)
    createFlexFX("LAUGH", WaveShape.Sawtooth, 280, 400, 100, 250, 450,
        SoundExpressionEffect.None, InterpolationCurve.Logarithmic);
    extendFlexFX("LAUGH", WaveShape.Square, 400, 280, 100, 250, 0,
        SoundExpressionEffect.None, InterpolationCurve.Linear);

    // somewhat cat-like
    createFlexFX("MIAOW", WaveShape.Sawtooth, 630, 900, 127.5, 255, 300,
        SoundExpressionEffect.None, InterpolationCurve.Curve);
    extendFlexFX("MIAOW", WaveShape.Sawtooth, 900, 810, 127.5, 255, 0,
        SoundExpressionEffect.None, InterpolationCurve.Linear);

    // somewhat cow-like
    createFlexFX("MOO", WaveShape.Sawtooth, 98, 140, 160, 200, 600,
        SoundExpressionEffect.None, InterpolationCurve.Curve);
    extendFlexFX("MOO", WaveShape.Sawtooth, 140, 98, 160, 200, 0,
        SoundExpressionEffect.None, InterpolationCurve.Linear);

    // engine-noise (kind-of)
    createFlexFX("MOTOR", WaveShape.Sawtooth, 105, 150, 240, 200, 450,
        SoundExpressionEffect.Tremolo, InterpolationCurve.Logarithmic);
    extendFlexFX("MOTOR", WaveShape.Sawtooth, 150, 120, 240, 200, 0,
        SoundExpressionEffect.Tremolo, InterpolationCurve.Linear);

    // questioning...
    createFlexFX("QUERY", WaveShape.Square, 330, 300, 50, 250, 180,
        SoundExpressionEffect.None, InterpolationCurve.Linear);
    extendFlexFX("QUERY", WaveShape.Square, 300, 450, 50, 250, 0,
        SoundExpressionEffect.None, InterpolationCurve.Curve);

    // Approximation to a snore!
    createFlexFX("SNORE", WaveShape.Noise, 3500, 700, 22, 222, 500,
        SoundExpressionEffect.Vibrato, InterpolationCurve.Linear);
    extendFlexFX("SNORE", WaveShape.Noise, 700, 4999.5, 22, 222, 0,
        SoundExpressionEffect.Vibrato, InterpolationCurve.Linear);

    // wailing sound
    createFlexFX("CRY", WaveShape.Square, 200, 800, 125, 250, 264,
        SoundExpressionEffect.None, InterpolationCurve.Linear);
    extendFlexFX("CRY", WaveShape.Square, 800, 400, 125, 250, 264,
        SoundExpressionEffect.None, InterpolationCurve.Linear);
    extendFlexFX("CRY", WaveShape.Square, 400, 600, 250, 125, 272,
        SoundExpressionEffect.None, InterpolationCurve.Linear);

    // sad whimpering moan
    createFlexFX("MOAN", WaveShape.Triangle, 540, 450, 90, 150, 420,
        SoundExpressionEffect.None, InterpolationCurve.Curve);
    extendFlexFX("MOAN", WaveShape.Triangle, 450, 427.5, 90, 150, 210,
        SoundExpressionEffect.None, InterpolationCurve.Curve);
    extendFlexFX("MOAN", WaveShape.Triangle, 427.5, 517.5, 150, 82.5, 70,
        SoundExpressionEffect.None, InterpolationCurve.Linear);

    // angry shout
    createFlexFX("SHOUT", WaveShape.Sawtooth, 120, 400, 125, 200, 300,
        SoundExpressionEffect.None, InterpolationCurve.Logarithmic);
    extendFlexFX("SHOUT", WaveShape.Sawtooth, 400, 360, 125, 200, 75,
        SoundExpressionEffect.None, InterpolationCurve.Linear);
    extendFlexFX("SHOUT", WaveShape.Sawtooth, 360, 120, 200, 187.5, 125,
        SoundExpressionEffect.None, InterpolationCurve.Linear);

    // Violin-like
    createFlexFX("VIOLIN", WaveShape.Sawtooth, 4.4, 440, 200, 150, 50,
        SoundExpressionEffect.None, InterpolationCurve.Logarithmic);
    extendFlexFX("VIOLIN", WaveShape.Sawtooth, 440, 440, 200, 150, 425,
        SoundExpressionEffect.None, InterpolationCurve.Linear);
    extendFlexFX("VIOLIN", WaveShape.Sawtooth, 440, 44, 150, 200, 25,
        SoundExpressionEffect.None, InterpolationCurve.Linear);

    // whale-song
    createFlexFX("WHALE", WaveShape.Square, 540, 405, 22, 222, 200,
        SoundExpressionEffect.None, InterpolationCurve.Curve);
    extendFlexFX("WHALE", WaveShape.Square, 405, 450, 22, 222, 800,
        SoundExpressionEffect.None, InterpolationCurve.Linear);
    extendFlexFX("WHALE", WaveShape.Square, 450, 360, 222, 11.1, 1000,
        SoundExpressionEffect.None, InterpolationCurve.Linear);

    // strange breed of dog
    createFlexFX("WOOF", WaveShape.Square, 300, 100, 250, 225, 30,
        SoundExpressionEffect.None, InterpolationCurve.Curve);
    extendFlexFX("WOOF", WaveShape.Sawtooth, 100, 225, 250, 225, 90,
        SoundExpressionEffect.None, InterpolationCurve.Linear);
    extendFlexFX("WOOF", WaveShape.Sawtooth, 225, 300, 225, 125, 180,
        SoundExpressionEffect.None, InterpolationCurve.Linear);

    // breathy flute
    createFlexFX("FLUTE", WaveShape.Noise, 25, 262.5, 250, 250, 75,
        SoundExpressionEffect.Vibrato, InterpolationCurve.Logarithmic);
    extendFlexFX("FLUTE", WaveShape.Triangle, 262.5, 250, 250, 250, 1200,
        SoundExpressionEffect.None, InterpolationCurve.Logarithmic);
    extendFlexFX("FLUTE", WaveShape.Triangle, 250, 200, 250, 0, 225,
        SoundExpressionEffect.None, InterpolationCurve.Linear);

    // Police siren (nee-naw) (middle part is silent)
    createFlexFX("SIREN", WaveShape.Sawtooth, 760, 800, 160, 200, 450,
        SoundExpressionEffect.None, InterpolationCurve.Linear);
    extendFlexFX("SIREN", WaveShape.Sine, 1, 1, 0, 0, 100,
        SoundExpressionEffect.None, InterpolationCurve.Linear);
    extendFlexFX("SIREN", WaveShape.Sawtooth, 1, 600, 0, 160, 450,
        SoundExpressionEffect.None, InterpolationCurve.Linear);

    // trouble ahead!
    createFlexFX("UHOH", WaveShape.Sawtooth, 165, 180, 80, 200, 200,
        SoundExpressionEffect.None, InterpolationCurve.Logarithmic);
    extendFlexFX("UHOH", WaveShape.Sine, 1, 1, 0, 0, 200,
        SoundExpressionEffect.None, InterpolationCurve.Linear);
    extendFlexFX("UHOH", WaveShape.Square, 1, 127.5, 0, 150, 600,
        SoundExpressionEffect.None, InterpolationCurve.Linear);

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
    flexFX.createFlexFX("", 100, 100, Wave.TRIANGLE, Attack.FAST, Effect.NONE, 100, 10,
        2000, 255, 200, BuiltInFlexFX.TING);

    // tweet
    flexFX.createFlexFX("", 80, 45,
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
