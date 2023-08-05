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

// Simplify the selection of wave-shape...
enum Wave {
    //%block="Pure"
    SINE = WaveShape.Sine,
    //%block="Buzzy"
    SQUARE = WaveShape.Square,
    //%block="Bright"music.builtinPlayableSoundEffect(soundExpression.giggle)
    TRIANGLE = WaveShape.Triangle,
    //%block="Harsh"
    SAWTOOTH = WaveShape.Sawtooth,
    //%block="Noisy"
    NOISE = WaveShape.Noise,
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
/**
 * Tools for creating composite sound-effects of class FlexFX that can be performed 
 * (either directly or queued-up) with dynamically-specified pitch, volume and duration.
 */
//% color=#70e030 weight=100 icon="\uf0a1 block="FlexFX"
//% groups=['Creating...', 'Playing...', 'Play-list...']
namespace flexFX {
    // Each performance will comprise an array of the "compiled" sound-strings for its several parts.
    class Play {
        parts: string[];
        constructor() {
            this.parts = [];
        }
    }
    // Performances get queued on the play-list to ensure proper asynch sequencing
    let playList: Play[] = []; 
    
    // control flags:
    let playerPlaying = false; // a performance is being played
    export function isPlaying(): boolean { return playerPlaying; } // accessor
    let playerActive = false;
    export function isActive(): boolean { return playerActive; } // accessor
    let playerStopped = false; // activation of player inhibited for now
    export function isStopped(): boolean { return playerStopped; } // accessor


    // activity events (for other components to synchronise with)
    const FLEXFX_ACTIVITY_ID = 1234 // TODO: Check this is a permissable value!
    enum PLAYER {
        STARTING = 1,
        FINISHED = 2,
        ALLPLAYED = 3,
    }

    // ---- Central array of currently defined FlexFX objects ----
    let flexFXList: FlexFX[] = [];

    // A FlexFX contains the recipe to compile a composite sound string.
    // It has up to three component soundExpressions, PartA, PartB & PartC
    // Each part has a start and an end [frequency,volume], but endA=startB and endB=startC,
    // so an n-part FlexFX moves through (n+1)) [frequency,volume,time] points
    class FlexFX {
        // properties
        id: string; // identifier
        // Points are defined to be fixed ratios of the "performance" [frequency,volume,duration] arguments
        playPartA: boolean;
        //partA: string;
        waveA: number;
        attackA: number;
        effectA: number;
        timeRatioA: number;

        skipPartB: boolean;     // marks a double FlexFX, which has a silent gap in the middle
        playPartB: boolean;
        //partB: string;
        waveB: number;
        attackB: number;
        effectB: number;
        timeRatioB: number;

        playPartC: boolean;
        //partC: string;
        waveC: number;
        attackC: number;
        effectC: number;
        timeRatioC: number;  // (always set to 1.0 - timeRatioA - timeRatioB)

        // Point 0
        freqRatio0: number;
        volRatio0: number;
        // Point 1
        freqRatio1: number;
        volRatio1: number;
        // Point 2
        usesPoint2: boolean;
        freqRatio2: number;
        volRatio2: number;
        // Point 3
        usesPoint3: boolean;
        freqRatio3: number;
        volRatio3: number;

        constructor(id: string) {
            this.id = id;
            // until otherwise instructed...
            this.playPartA = false;
            this.playPartB = false;
            this.playPartC = false;
            this.usesPoint2 = false;
            this.usesPoint3 = false;
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
        // methods...  
        // Sets up Part A:  (Point0)--PartA--(Point1)...
        // This implicitly sets the start values for any Part B that might follow
        setPartA(freq0: number, vol0: number, wave: Wave, attack: number, effect: number, freq1: number, vol1: number, ms1: number) {
            this.freqRatio0 = this.goodFreqRatio(freq0);
            this.volRatio0 = this.goodVolRatio(vol0);
            this.freqRatio1 = this.goodFreqRatio(freq1);
            this.volRatio1 = this.goodVolRatio(vol1);
            this.timeRatioA = this.goodTimeRatio(ms1,1.0);
            this.waveA = wave;
            this.attackA = attack;
            this.effectA = effect;

            // To allow a soundExpression string to be read as a normal string
            // we need it to form part of a temporary (throw-away) Sound object
            // let sex = new soundExpression.Sound;

            
            this.playPartA = true;
        // clear other flags for parts B & C that might have been set...
            this.playPartB = false;
            this.playPartC = false;
            this.usesPoint2 = false;
            this.usesPoint3 = false;
        }
        // Adds a  Part B:  (Point0)--PartA--(Point1)--PartB--(Point2)...
        // This also implicitly sets the start values for any Part C that might follow
        setPartB(wave: number, attack: number, effect: number, freq2: number, vol2: number, ms2: number) {
            this.freqRatio2 = this.goodFreqRatio(freq2);
            this.volRatio2 = this.goodVolRatio(vol2);
            this.timeRatioB = this.goodTimeRatio(ms2, 1.0 - this.timeRatioA);
            this.waveB = wave;
            this.attackB = attack;
            this.effectB = effect;
            this.playPartB = true;
            this.usesPoint2 = true;
        }
        // Adds a silent Part B:  (Point0)--PartA--(Point1)--silence--(Point2)...
        // This implicitly sets start values for the Part C that follows
        silentPartB(freq2: number, vol2: number, ms2: number) {
            this.freqRatio2 = this.goodFreqRatio(freq2);
            this.volRatio2 = this.goodVolRatio(vol2);
            this.timeRatioB = this.goodTimeRatio(ms2, 1.0 - this.timeRatioA);
            this.skipPartB = true;
        }

        // Adds an optional part C: (Point0)--PartA--(Point1)--PartB--(Point2)--PartC--(Point3)
        setPartC(wave: number, attack: number, effect: number, freq3: number, vol3: number, ms3: number) {
            this.freqRatio3 = this.goodFreqRatio(freq3);
            this.volRatio3 = this.goodVolRatio(vol3);
            this.timeRatioC = this.goodTimeRatio(ms3, 1.0 - this.timeRatioA - this.timeRatioB);
            this.waveC = wave;
            this.attackC = attack;
            this.effectC = effect;
            this.playPartC = true;
            this.usesPoint2 = true;
            this.usesPoint3 = true;
        }

        // Compiles a performance (called a Play) for this FlexFX and adds it to the Play-list
        compilePlay(freq: number, vol: number, ms: number) {
            let loud = vol * 4 // map from [0...255] into range [0...1023]
            // Point 0
            let f0 = freq * this.freqRatio0;
            let v0 = loud * this.volRatio0;
            // Point 1
            let f1 = freq * this.freqRatio1;
            let v1 = loud * this.volRatio1;
            let ms1 = ms * this.timeRatioA;
            // declarations required, even if unused...
            let f2 = 0;
            let v2 = 0;
            let ms2 = 0;
            let f3 = 0;
            let v3 = 0;
            let ms3 = 0;
            // Point 2
            if (this.usesPoint2) {
                f2 = freq * this.freqRatio2;
                v2 = loud * this.volRatio2;
                ms2 = ms * this.timeRatioB;
            }
            // Point 3
            if (this.usesPoint3) {
                f3 = freq * this.freqRatio3;
                v3 = loud * this.volRatio3;
                ms3 = ms * this.timeRatioC;
            }

            // now create the actual performance Play...
            let play = new Play;
            if (this.playPartA) {
                play.parts.push(music.createSoundEffect(this.waveA,f0,f1,v0,v1,ms1,this.effectA, this.attackA));
            }
            if (this.playPartB) {
                play.parts.push(music.createSoundEffect(this.waveB,f1,f2,v1,v2,ms2,this.effectB, this.attackB));
            } else {
                if (this.skipPartB) {   //   ...instruct a silent gap in the middle...
                play.parts.push("_"+ convertToText(Math.floor(ms * this.timeRatioB)));
                }
            }
            if (this.playPartC) {
                play.parts.push(music.createSoundEffect(this.waveC,f2,f3,v2,v3,ms3,this.effectC, this.attackC));
            }     
            //append new Play onto the end of the playList
            playList.push(play);
        }
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
            let sound = "";
            play = playList.shift();
            if (play.parts[0].charAt(0) == 's') {
                // this is just a queued pause, so doesn't count as "PLAYING"
                sound = play.parts.shift();
                pause(parseInt(sound.slice(1, sound.length)));
            } else {
                control.raiseEvent(FLEXFX_ACTIVITY_ID, PLAYER.STARTING);
                playerPlaying = true;
                while (play.parts.length > 0) {  // play its sounds in turn
                    sound = play.parts.shift();
                    if (sound.charAt(0) == ' ') {
                    // this is a gap within a sound, so DOES still count as "PLAYING"
                        pause(parseInt(sound.slice(1, sound.length)));
                    } else {
                        music.playSoundEffect(sound, SoundExpressionPlayMode.UntilDone)
                    }
                }
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
     * Create a simple custom FlexFX 
     */
    //% block="create simple FlexFX: $id using wave-shape $wave      with attack $attack       and effect $effect|  pitch profile goes from $startPitchPercent                       to $endPitchPercent|volume profile goes from $startVolPercent                       to $endVolPercent"
    //% group="Creating..."
    //% help=pxt-flexfx/createFlexFX
    //% inlineInputMode=external
    //% id.defl="simple"
    //% startPitchPercent.min=25 startPitchPercent.max=400 startPitchPercent.defl=100
    //% startVolPercent.min=1 startVolPercent.max=100 startVolPercent.defl=100
    //% endPitchPercent.min=10 endPitchPercent.max=400 endPitchPercent.defl=100
    //% endVolPercent.min=1 endVolPercent.max=100 endVolPercent.defl=100
    //% weight=250
    export function createFlexFX(
        id: string, startPitchPercent: number, startVolPercent: number,
        wave: Wave, attack: Attack, effect: Effect, endPitchPercent: number, endVolPercent: number) {
        // select or create target...        
        let target: FlexFX = flexFXList.find(i => i.id === id);
        if (target == null) {
            target = new FlexFX(id);
            flexFXList.push(target);
        }
        target.setPartA(startPitchPercent / 100, startVolPercent / 100, wave, attack, effect, endPitchPercent / 100, endVolPercent / 100, 1.0);
    }


    /**
    Create a more complex two-part custom FlexFX 
     */
    //% block="create 2-part FlexFX: $id| first using wave-shape $waveA            with attack $attackA             and effect $effectA|  then using wave-shape $waveB            with attack $attackB             and effect $effectB|  pitch profile goes from $startPitchPercent                       to $midPitchPercent                       to $endPitchPercent|volume profile goes from $startVolPercent                       to $midVolPercent                       to $endVolPercent|duration used for 1st part: $timePercentA"
    //% group="Creating..."
    //% help=pxt-flexfx/create2PartFlexFX
    //% inlineInputMode=external
    //% id.defl="2-part"
    //% startPitchPercent.min=10 startPitchPercent.max=400 startPitchPercent.defl=100
    //% startVolPercent.min=1 startVolPercent.max=100 startVolPercent.defl=100
    //% midPitchPercent.min=10 midPitchPercent.max=400 midPitchPercent.defl=100
    //% midVolPercent.min=1 midVolPercent.max=0 midVolPercent.defl=100
    //% endPitchPercent.min=10 endPitchPercent.max=400 endPitchPercent.defl=100
    //% endVolPercent.min=1 endVolPercent.max=100 endVolPercent.defl=100
    //% timePercentA.min=1 timePercentA.max=99 timePercentA.defl=50
    //% weight=240
    export function create2PartFlexFX(
        id: string, startPitchPercent: number, startVolPercent: number,
        waveA: Wave, attackA: Attack, effectA: Effect, midPitchPercent: number, midVolPercent: number,
        waveB: Wave, attackB: Attack, effectB: Effect, endPitchPercent: number, endVolPercent: number, timePercentA: number) {
        // select or create target...        
        let target: FlexFX = flexFXList.find(i => i.id === id);
        if (target == null) {
            target = new FlexFX(id);
            flexFXList.push(target);
        }
        target.setPartA(startPitchPercent / 100, startVolPercent / 100, waveA, attackA, effectA, midPitchPercent / 100, midVolPercent / 100, timePercentA / 100);
        target.setPartB(waveB, attackB, effectB, endPitchPercent / 100, endVolPercent / 100,
            (100 - timePercentA / 100));

    }

    /**
    Create a really complex three-part custom FlexFX 
     */
    //% block="create 3-part FlexFX: $id|  first using wave-shape $waveA             with attack $attackA              and effect $effectA|   then using wave-shape $waveB             with attack $attackB              and effect $effectB|lastly using wave-shape $waveC             with attack $attackC              and effect $effectC|  pitch profile goes from $startPitchPercent                       to $pitchABPercent                       to $pitchBCPercent                       to $endPitchPercent|volume profile goes from $startVolPercent                       to $volABPercent                       to $volBCPercent                       to $endVolPercent|duration used for 1st part:$timePercentA|                   2nd part: $timePercentB"
    //% group="Creating..."
    //% help=pxt-flexfx/create3PartFlexFX
    //% inlineInputMode=external
    //% id.defl="3-part"
    //% startPitchPercent.min=10 startPitchPercent.max=400 startPitchPercent.defl=100
    //% startVolPercent.min=1 startVolPercent.max=100 startVolPercent.defl=100
    //% pitchABPercent.min=10 pitchABPercent.max=400 pitchABPercent.defl=100
    //% volABPercent.min=1 volABPercent.max=0 volABPercent.defl=100
    //% pitchBCPercent.min=10 pitchBCPercent.max=400 pitchBCPercent.defl=100
    //% volBCPercent.min=1 volBCPercent.max=0 volBCPercent.defl=100
    //% endPitchPercent.min=10 endPitchPercent.max=400 endPitchPercent.defl=100
    //% endVolPercent.min=1 endVolPercent.max=100 endVolPercent.defl=100
    //% timePercentA.min=1 timePercentA.max=99 timePercentA.defl=33
    //% timePercentB.min=1 timePercentB.max=99 timePercentB.defl=33
    //% weight=2300
    export function create3PartFlexFX(
        id: string, startPitchPercent: number, startVolPercent: number,
        waveA: Wave, attackA: Attack, effectA: Effect, pitchABPercent: number, volABPercent: number,
        waveB: Wave, attackB: Attack, effectB: Effect, pitchBCPercent: number, volBCPercent: number,
        waveC: Wave, attackC: Attack, effectC: Effect, endPitchPercent: number, endVolPercent: number,
        timePercentA: number, timePercentB: number) {
        // select or create target...        
        let target: FlexFX = flexFXList.find(i => i.id === id);
        if (target == null) {
            target = new FlexFX(id);
            flexFXList.push(target);
        }
        target.setPartA(startPitchPercent / 100, startVolPercent / 100, waveA, attackA, effectA, pitchABPercent / 100, volABPercent / 100, timePercentA / 100);
        target.setPartB(waveB, attackB, effectB, pitchBCPercent / 100, volBCPercent / 100, timePercentB / 100);
        target.setPartC(waveC, attackC, effectC, endPitchPercent / 100, endVolPercent / 100,
            (100 - timePercentA - timePercentB) / 100);
    }

    /**
    Create a FlexFx with two parts separated by a silence.
    */
    // NOTE: Since it's the second actual sound, PartC is called PartB in the UI
    //% block="create double FlexFX: $id|1st part using wave-shape $waveA               with attack $attackA                and effect $effectA|  pitch profile goes from $startPitchAPercent                       to $endPitchAPercent|volume profile goes from $startVolAPercent                       to $endVolAPercent|duration used for 1st part:$timePercentA|duration used for silence:  $timeGapPercent|2nd part using wave-shape $waveB               with attack $attackB                and effect $effectB|  pitch profile goes from $startPitchBPercent                       to $endPitchBPercent|volume profile goes from $startVolBPercent                       to $endVolBPercent"
    //% group="Creating..."
    //% help=pxt-flexfx/createDoubleFlexFX
    //% inlineInputMode=external
    //% id.defl="double"
    //% startPitchAPercent.min=10 startPitchAPercent.max=400 startPitchAPercent.defl=100
    //% startVolAPercent.min=1 startVolAPercent.max=100 startVolAPercent.defl=100
    //% endPitchAPercent.min=10 endPitchAPercent.max=400 endPitchAPercent.defl=100
    //% endVolAPercent.min=1 endVolAPercent.max=100 endVolAPercent.defl=100
    //% startPitchBPercent.min=10 startPitchBPercent.max=400 startPitchBPercent.defl=75
    //% startVolBPercent.min=1 startVolBPercent.max=100 startVolBPercent.defl=100
    //% endPitchBPercent.min=10 endPitchBPercent.max=400 endPitchBPercent.defl=75
    //% endVolBPercent.min=1 endVolBPercent.max=100 endVolBPercent.defl=100
    //% timePercentA.min=1 timePercentA.max=99 timePercentA.defl=40
    //% timeGapPercent.min=1 timeGapPercent.max=99 timeGapPercent.defl=20
    //% weight=220
    export function createDoubleFlexFX(
        id: string, startPitchAPercent: number, startVolAPercent: number,
        waveA: Wave, attackA: Attack, effectA: Effect, endPitchAPercent: number, endVolAPercent: number,
        startPitchBPercent: number, startVolBPercent: number,
        waveB: Wave, attackB: Attack, effectB: Effect, endPitchBPercent: number, endVolBPercent: number,
        timePercentA: number, timeGapPercent: number) {

        // select or create target...        
        let target: FlexFX = flexFXList.find(i => i.id === id);
        if (target == null) {
            target = new FlexFX(id);
            flexFXList.push(target);
        }
        target.setPartA(startPitchAPercent / 100, startVolAPercent / 100, waveA, attackA, effectA, endPitchAPercent / 100, endVolAPercent / 100, timePercentA / 100);
        target.silentPartB(startPitchBPercent / 100, startVolBPercent / 100, timeGapPercent / 100);
        target.setPartC(waveB, attackB, effectB, endPitchBPercent / 100, endVolBPercent / 100, (100 - timePercentA - timeGapPercent) / 100);
    }

    /**
     * Perform a custom FlexFX 
     */
    //% block="perform FlexFX $id at pitch $pitch with strength $vol for $ms || queued = $background"
    //% group="Playing..."
    //% help=pxt-flexfx/performflexfx
    //% id.defl="Ting"
    //% pitch.min=50 pitch.max=2000 pitch.defl=800
    //% vol.min=0 vol.max=255 vol.defl=200
    //% ms.min=0 ms.max=10000 ms.defl=800
    //% background.defl=false
    //% inlineInputMode=inline
    //% expandableArgumentMode="enabled"
    //% weight=150
    export function performFlexFX(id: string, pitch: number, vol: number, ms: number, background: boolean) {
        let target: FlexFX = flexFXList.find(i => i.id === id);
        if (target != null) {
            // first compile and add our Play onto the playList
            target.compilePlay(pitch, vol, ms); 
            activatePlayer();  // make sure it will get played
            if (!background) { // ours was the lastest Play, so simply await completion of player.
                control.waitForEvent(FLEXFX_ACTIVITY_ID, PLAYER.ALLPLAYED);
            }
        }
    }

    /**
     * Add a silent pause to the play-list
     */
    //% block="add a pause of $ms ms next in the play-list"
    //% group="Play-list..."
    //% weight=50
    export function performSilence(ms: number) {
        let play = new Play;
        play.parts.push("s" + convertToText(Math.floor(ms)));
        playList.push(play);
        activatePlayer();  // make sure it gets played
    }

    /**
     * Await start of next FLexFX on the play-list
     */
    //% block="wait until next FLexFX starts"
    //% group="Play-list..."
    //% weight=45
    export function awaitPlayStart() {
        control.waitForEvent(FLEXFX_ACTIVITY_ID, PLAYER.STARTING);
    }

    /**
     * Await completion of FLexFX currently playing
     */
    //% block="wait until current FlexFX finished"
    //% group="Play-list..."
    //% weight=40
    export function awaitPlayFinish() {
        control.waitForEvent(FLEXFX_ACTIVITY_ID, PLAYER.FINISHED);
    }

    /**
     * Await completion of everything on the play-list
     */
    //% block="wait until everything played"
    //% group="Play-list..."
    //% weight=35
    export function awaitAllFinished() {
        control.waitForEvent(FLEXFX_ACTIVITY_ID, PLAYER.ALLPLAYED);
    }

    /**
     * Check the length of the play-list
     */
    //% block="length of play-list"
    //% group="Play-list..."
    //% weight=30
    export function waitingToPlay(): number {
        return playList.length;
    }

    /**
     * Suspend background playing from the play-list
     */
    //% block="pause play-list"
    //% group="Play-list..."
    //% weight=25
    export function stopPlaying() {
        playerStopped = true;
    }
    
    /**
     * Resume background playing from the play-list
     */
    //% block="play play-list"
    //% group="Play-list..."
    //% weight=20
    export function startPlaying() {
        playerStopped = false;
        activatePlayer();
    }

    // create a simple default "chime" flexFX
    flexFX.createFlexFX("Ting", 100, 100, Wave.TRIANGLE, Attack.FAST, Effect.NONE, 100, 10);
}