/* FlexFX
While the built-in facilities for creating sound-effects are impressively flexible,
they are insufficiently flexible for some contexts (such as to properly express moods and emotions.)

This extension allows the creation of more complex sounds, that have inflections in both pitch 
and volume. In the context of mood-sounds, this might include a laugh, a moan or an "Uh-oh" that indicates a problem.

To achieve this we have defined a flexible sound-effect class called a "FlexFX".
It can involve up to three separate sound parts that will then be played consecutively
to give a smoothly varying result when spliced together.

Internally, sound effects are specified by a string of 72 decimal digits, broken into several 
fields (many of which appear to be either obsolete or redundant). 

Notable SoundExpression string fields are laid out as follows:
        [0]:        Wave            (1 digit)
        [1-3]:      Start Volume    (4 digits)
        [5-8]:      Start Frequency (4 digits)
        [9-12]:     Duration        (4 digits)
        [13-17]:    Interpolation   (5 digits)
        [18-21]:    End Frequency   (4 digits)
        [22-25]:    --other stuff-- (4 digits)
        [26-29]:    End Volume      (4 digits)
        [30-71]:    --other stuff-- (42 digits)
        
On each invocation the core function createSoundEffect() takes eight arguments and works quite hard 
to encode them into their respective fields. 

We would like to be able to repeatedly vary the overall pitch or volume of any given FlexFX.
Conventionally, that would require reconstructing all three sound effects from scratch for each 
performance (or saving a wide range of 3*72-character strings we had prepared earlier).
Instead we choose to selectively overwrite certain 4-digit fields within the three soundExpressions 
in our three-part FlexFX, to "tune" its pitch and volume as we require.

*** It is acknowledged that this is a DANGEROUS PRACTICE that relies on the internal
*** representation not changing, but it is believed that the performance gains justify it!

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
    //%block="Bright"
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
 * Tools for creating composite sound-effects (of class FlexFX) that can be performed with
 * dynamically-specified pitch, volume and duration. Provides a built-in set of samples.
 */
//% color=#70e030 weight=100 icon="\uf0a1 block="FlexFX"
namespace flexFX {
    // provide activity events (for other components to synchronise with)
    const FLEXFX_ACTIVITY_ID = 1234 // TODO: Check this is a permissable value!
    enum Status {
        STARTING = 1,
        FINISHED = 2
    }
    // semaphore to prevent possible interference between concurrent performances
    let quiet = true;

    // ---- Central array of currently defined FlexFX objects ----
    let flexFXList: FlexFX[] = [];

    class FlexFX {
        // properties
        id: string; // identifier

        // There are up to three component soundExpressions, PartA, PartB & PartC
        // Each part has a start and an end [frequency,volume], but endA===startB 
        // and endB===startC, so a three-part FlexFX moves through four [frequency,volume,time] points
        // Points are defined to be fixed ratios of the "performance" [frequency,volume,duration] arguments
        playPartA: boolean;
        partA: soundExpression.Sound;
        waveA: string;
        from13A: string;
        from22A: string;
        from30A: string;
        timeRatioA: number;

        skipPartB: boolean;     // a double FlexFX has a silent gap in the middle
        playPartB: boolean;
        partB: soundExpression.Sound;
        waveB: string;
        from13B: string;
        from22B: string;
        from30B: string;
        timeRatioB: number;

        playPartC: boolean;
        partC: soundExpression.Sound;
        waveC: string;
        from13C: string;
        from22C: string;
        from30C: string;
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
        protected formatNumber(num: number, length: number) {
            let result = Math.constrain(num | 0, 0, Math.pow(10, length) - 1) + "";
            while (result.length < length) result = "0" + result;
            return result;
        }

        protected insert(expression: string, offset: number, digits: string): string {
            return expression.substr(0, offset) + digits + expression.substr(offset + digits.length);
        }



        protected assemble(startFreq: string, startVol: string, endFreq: string, endVol: string, ms: string,
            wave: string, from13: string, from22: string, from30: string): string {
            return wave + startVol + startFreq + ms + from13 + endFreq + from22 + endVol + from30;
        }


        // methods...  
        // Sets up Part A:  (Point0)--(PartA)--(Point1)...
        // This implicitly sets the start values for any Part B that follows
        setPartA(freq0: number, vol0: number, wave: number, shape: number, fx: number, freq1: number, vol1: number, ms1: number) {
            this.freqRatio0 = freq0;
            this.volRatio0 = vol0;
            this.freqRatio1 = freq1;
            this.volRatio1 = vol1;
            this.timeRatioA = ms1;
            this.partA = new soundExpression.Sound;
            this.partA.src = music.createSoundEffect(wave, 100, 101, 102, 103, 104, fx, shape);
            // dismantle reusable parts...
            this.waveA = this.partA.src[0];
            this.from13A = this.partA.src.substr(13, 5);
            this.from22A = this.partA.src.substr(22, 4);
            this.from30A = this.partA.src.substr(30, 42);
            this.playPartA = true;
        }
        // Adds a  Part B:  (Point0)--(PartA)--(Point1)--(PartB)--(Point2)...
        // This also implicitly sets the start values for any Part C that follows
        setPartB(wave: number, shape: number, fx: number, freq2: number, vol2: number, ms2: number) {
            this.freqRatio2 = freq2;
            this.volRatio2 = vol2;
            this.timeRatioB = ms2;
            this.partB = new soundExpression.Sound;
            this.partB.src = music.createSoundEffect(wave, 200, 201, 202, 203, 204, fx, shape);
            // dismantle reusable parts...
            this.waveB = this.partA.src[0];
            this.from13B = this.partB.src.substr(13, 5);
            this.from22B = this.partB.src.substr(22, 4);
            this.from30B = this.partB.src.substr(30, 42);
            this.playPartB = true;
            this.usesPoint2 = true;
        }
        // Adds a silent Part B:  (Point0)--(PartA)--(Point1)--(silence)--(Point2)...
        // This implicitly sets start values for the Part C that follows
        silentPartB(freq2: number, vol2: number, ms2: number) {
            this.freqRatio2 = freq2;
            this.volRatio2 = vol2;
            this.timeRatioB = ms2;
            this.skipPartB = true;
        }

        // Adds an optional part C: (Point0)--(PartA)--(Point1)--(PartB)--(Point2)--(PartC)--(Point3)
        setPartC(wave: number, shape: number, fx: number, freq3: number, vol3: number, ms3: number) {
            this.freqRatio3 = freq3;
            this.volRatio3 = vol3;
            this.timeRatioC = ms3;
            this.partC = new soundExpression.Sound;
            this.partC.src = music.createSoundEffect(wave, 300, 301, 302, 303, 304, fx, shape);
            // dismantle reusable parts...
            this.waveC = this.partA.src[0];
            this.from13C = this.partC.src.substr(13, 5);
            this.from22C = this.partC.src.substr(22, 4);
            this.from30C = this.partC.src.substr(30, 42);
            this.playPartC = true;
            this.usesPoint2 = true;
            this.usesPoint3 = true;
        }

        performUsing(freq: number, vol: number, ms: number) {
            let loud = vol * 4 // map from [0...255] into range [0...1023]
            // Point 0
            let f0 = this.formatNumber(freq * this.freqRatio0, 4);
            let v0 = this.formatNumber(loud * this.volRatio0, 4);
            // Point 1
            let f1 = this.formatNumber(freq * this.freqRatio1, 4);
            let v1 = this.formatNumber(loud * this.volRatio1, 4);
            let ms1 = this.formatNumber(ms * this.timeRatioA, 4);
            // declarations required, even if unused...
            let f2 = "";
            let v2 = "";
            let ms2 = "";
            let f3 = "";
            let v3 = "";
            let ms3 = "";
            // Point 2
            if (this.usesPoint2) {
                f2 = this.formatNumber(freq * this.freqRatio2, 4);
                v2 = this.formatNumber(loud * this.volRatio2, 4);
                ms2 = this.formatNumber(ms * this.timeRatioB, 4);
            }
            // Point 3
            if (this.usesPoint3) {
                f3 = this.formatNumber(freq * this.freqRatio3, 4);
                v3 = this.formatNumber(loud * this.volRatio3, 4);
                ms3 = this.formatNumber(ms * this.timeRatioC, 4);
            }

            // adjust PartA frequencies, volumes and duration 
            this.partA.src = this.assemble(f0, v0, f1, v1, ms1,
                this.waveA, this.from13A, this.from22A, this.from30A);
            if (this.playPartB) {   // adjust PartB frequencies, volumes and duration 
                this.partB.src = this.assemble(f1, v1, f2, v2, ms2,
                    this.waveB, this.from13B, this.from22B, this.from30B);
            }
            if (this.playPartC) {   // adjust PartC frequencies, volumes and duration
                this.partC.src = this.assemble(f2, v2, f3, v3, ms3,
                    this.waveC, this.from13C, this.from22C, this.from30C);
            }

            // now for the actual performance...
            control.raiseEvent(FLEXFX_ACTIVITY_ID, Status.STARTING); // e.g. to synchronise opening displayed mouth
            if (this.playPartA) {
                music.playSoundEffect(this.partA.src, SoundExpressionPlayMode.UntilDone);
            }
            if (this.playPartB) {
                music.playSoundEffect(this.partB.src, SoundExpressionPlayMode.UntilDone);
            } else {
                if (this.skipPartB) {   //   ...a silent gap in the middle...
                    basic.pause(ms * this.timeRatioB);
                }
            }
            if (this.playPartC) {
                music.playSoundEffect(this.partC.src, SoundExpressionPlayMode.UntilDone);
            }
            control.raiseEvent(FLEXFX_ACTIVITY_ID, Status.FINISHED); // e.g. to synchronise closing displayed mouth
        }
    }

    // ---- ADVANCED UI BLOCKS ----
    /**
    Perform a custom FlexFX 
     */
    //% block="perform FlexFX $id at pitch $pitch with strength $vol for $ms ms"
    //% help=pxt-flexfx/performflexfx
    //% id.defl="DOO"
    //% pitch.min=50 pitch.max=2000 pitch.defl=250
    //% vol.min=0 vol.max=255 vol.defl=180
    //% ms.min=0 ms.max=10000 ms.defl=750
    //% inlineInputMode=inline
    //% advanced=true
    //% weight=150
    export function performFlexFX(id: string, pitch: number, vol: number, ms: number) {
        let target: FlexFX = flexFXList.find(i => i.id === id);
        if (target != null) {
            target.performUsing(pitch, vol, ms);
        }
    }

    /**
    Create a simple custom FlexFX 
     */
    //% block="create simple FlexFX: $id using wave-shape $wave      with attack $attack       and effect $effect|  pitch profile goes from $startPitchPercent                       to $endPitchPercent|volume profile goes from $startVolPercent                       to $endVolPercent"
    //% inlineInputMode=external
    //% id.defl="simple"
    //% startPitchPercent.min=25 startPitchPercent.max=400 startPitchPercent.defl=100
    //% startVolPercent.min=1 startVolPercent.max=100 startVolPercent.defl=100
    //% endPitchPercent.min=10 endPitchPercent.max=400 endPitchPercent.defl=100
    //% endVolPercent.min=1 endVolPercent.max=100 endVolPercent.defl=100
    //% advanced=true
    //% weight=140
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
    //% inlineInputMode=external
    //% id.defl="2-part"
    //% startPitchPercent.min=10 startPitchPercent.max=400 startPitchPercent.defl=100
    //% startVolPercent.min=1 startVolPercent.max=100 startVolPercent.defl=100
    //% midPitchPercent.min=10 midPitchPercent.max=400 midPitchPercent.defl=100
    //% midVolPercent.min=1 midVolPercent.max=0 midVolPercent.defl=100
    //% endPitchPercent.min=10 endPitchPercent.max=400 endPitchPercent.defl=100
    //% endVolPercent.min=1 endVolPercent.max=100 endVolPercent.defl=100
    //% timePercentA.min=1 timePercentA.max=99 timePercentA.defl=50
    //% advanced=true
    //% weight=130
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
            1.0 - (timePercentA / 100));

    }

    /**
    Create a really complex three-part custom FlexFX 
     */
    //% block="create 3-part FlexFX: $id|  first using wave-shape $waveA             with attack $attackA              and effect $effectA|   then using wave-shape $waveB             with attack $attackB              and effect $effectB|lastly using wave-shape $waveC             with attack $attackC              and effect $effectC|  pitch profile goes from $startPitchPercent                       to $pitchABPercent                       to $pitchBCPercent                       to $endPitchPercent|volume profile goes from $startVolPercent                       to $volABPercent                       to $volBCPercent                       to $endVolPercent|duration used for 1st part:$timePercentA|                   2nd part: $timePercentB"
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
    //% advanced=true
    //% weight=120
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
            1.0 - (timePercentA - timePercentB) / 100);

    }


    /**
    Create a FlexFx with two parts separated by a silence.
    */
    //% block="create double FlexFX: $id|1st part using wave-shape $waveA               with attack $attackA                and effect $effectA|  pitch profile goes from $startPitchAPercent                       to $endPitchAPercent|volume profile goes from $startVolAPercent                       to $endVolAPercent|duration used for 1st part:$timePercentA|duration used for silence:  $timeGapPercent|2nd part using wave-shape $waveB               with attack $attackB                and effect $effectB|  pitch profile goes from $startPitchBPercent                       to $endPitchBPercent|volume profile goes from $startVolBPercent                       to $endVolBPercent"
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
    //% advanced=true
    //% weight=110
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
        target.setPartC(waveB, attackB, effectB, endPitchBPercent / 100, endVolBPercent / 100,
            1.0 - (timePercentA - timeGapPercent) / 100);

    }
}