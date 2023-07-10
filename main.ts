/* FlexFX
While the built-in facilities for creating sound-effects are impressively flexible,
they are insufficiently flexible for some contexts (such as to properly express moods and emotions.)

This extension allows the creation of more complex sounds, that have inflections in both pitch 
and volume. In the context of mood-sounds, this might include a laugh, a moan or an "Uh-oh" that indicates a problem.

To achieve this we have defined a flexible sound-effect class called a "FlexFX".
It can involve up to three separate sound parts that will then be played consecutively
to give a smoothly varying result when spliced together.

Internally, sound effects are specified by a string of 72 decimal digits, broken into several 
fields (many of which appear to be either obsolete or redundant). On each invocation the core 
function createSoundEffect() takes eight arguments and works quite hard to encode them into their
respective fields.

We would like to be able to repeatedly vary the overall pitch or volume of any given FlexFX.
Conventionally, that would require reconstructing all three sound effects from scratch for each 
performance (or saving a wide range of 3*72-character strings we had prepared earlier).
Instead we choose to selectively overwrite certain 4-digit fields within the three soundExpressions 
in our three-part FlexFX, to "tune" its pitch and volume as we require.

*** It is acknowledged that this is a DANGEROUS PRACTICE that relies on the internal
*** representation not changing, but it is believed that the performance gains justify it!

*/

/**
 * Tools for creating composite sound-effects (of class FlexFX) that can be performed with
 * dynamically-specified pitch, volume and duration. Provides a built-in list of samples.
 */
//% color=0#7eff33 weight=100 icon="\uf4ad" block="FlexFX"
//% groups=['Simple', 'Advanced']
namespace flexFX {
    // We identify field-offsets defensively, just in case SoundExpression field-locations should 
    // change in future. (We presume their width will always be 4 digits)
    const startVolPos = 1
    const startFreqPos = 5
    const durationPos = 9
    const endVolPos = 26
    const endFreqPos = 18

    // NOTE: The built-in enums for sound effect parameters are hardly beginner-friendly!
    //       By renaming them we can expose somewhat simpler concepts. 
    //       (This only works if we pass them over a function-call as arguments of type: number.)
    // simplify the selection of wave-shape...
    enum Wave {
        //%block="Pure"
        SINE = WaveShape.Sine,
        //%block="Harsh"
        SAWTOOTH = WaveShape.Sawtooth,
        //%block="Mellow"
        TRIANGLE = WaveShape.Triangle,
        //%block="Buzzy"
        SQUARE = WaveShape.Square,
        //%block="Noisy"
        NOISE = WaveShape.Noise,
    }
    // simplify the selection of frequency-trajectory...
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


    // provide activity events (for other components to synchronise with)
    const FLEXFX_ACTIVITY_id = 1234 // TODO: Check this is a permissable value!
    enum Status {
        STARTING = 1,
        FINISHED = 2
    }

    class FlexFX {
        // properties
        id: string; // identifier

        // There are up to three component soundExpressions, PartA, PartB & PartC
        // Each part has a start and an end [frequency,volume], but endA===startB 
        // and endB===startC, so a three-part FlexFX moves through four [frequency,volume,time] points
        // Points are defined to be fixed ratios of the "performance" [frequency,volume,duration] arguments
        playPartA: boolean;
        partA: soundExpression.Sound;
        timeRatioA: number;

        skipPartB: boolean;     // a double FlexFX has a silent gap in the middle
        playPartB: boolean;
        partB: soundExpression.Sound;
        timeRatioB: number;

        playPartC: boolean;
        partC: soundExpression.Sound;
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
            this.partA.src = music.createSoundEffect(wave, 333, 333, 666, 666, 999, fx, shape);
            this.playPartA = true;
        }
        // Adds a  Part B:  (Point0)--(PartA)--(Point1)--(PartB)--(Point2)...
        // This also implicitly sets the start values for any Part C that follows
        setPartB(wave: number, shape: number, fx: number, freq2: number, vol2: number, ms2: number) {
            this.freqRatio2 = freq2;
            this.volRatio2 = vol2;
            this.timeRatioB = ms2;
            this.partB = new soundExpression.Sound;
            this.partB.src = music.createSoundEffect(wave, 333, 333, 666, 666, 999, fx, shape);
            this.playPartB = true
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
            // we have a PartC as well...
            this.freqRatio3 = freq3;
            this.volRatio3 = vol3;
            this.timeRatioC = ms3;
            this.partC = new soundExpression.Sound;
            this.partC.src = music.createSoundEffect(wave, 333, 333, 666, 666, 999, fx, shape);
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
            let ms1 = this.formatNumber(ms * this.timeRatioA, 4)
            // declarations required, even if unused...
            let f2 = "";
            let v2 = "";
            let ms2 = "";
            let f3 = "";
            let v3 = "";
            let ms3 = "";
            // Point 2
            if (this.usesPoint2) {
                let f2 = this.formatNumber(freq * this.freqRatio2, 4);
                let v2 = this.formatNumber(loud * this.volRatio2, 4);
                let ms2 = this.formatNumber(ms * this.timeRatioB, 4)
            }
            // Point 3
            if (this.usesPoint3) {
                let f3 = this.formatNumber(freq * this.freqRatio3, 4);
                let v3 = this.formatNumber(loud * this.volRatio3, 4);
                let ms3 = this.formatNumber(ms * this.timeRatioC, 4)
            }

            // adjust PartA frequencies, volumes and duration 
            this.partA.src = this.insert(this.partA.src, startFreqPos, f0);
            this.partA.src = this.insert(this.partA.src, startVolPos, v0);
            this.partA.src = this.insert(this.partA.src, endFreqPos, f1);
            this.partA.src = this.insert(this.partA.src, endVolPos, v1);
            this.partA.src = this.insert(this.partA.src, durationPos, ms1);

            if (this.playPartB) {   // adjust PartB frequencies, volumes and duration 
                this.partB.src = this.insert(this.partA.src, startFreqPos, f1);
                this.partB.src = this.insert(this.partA.src, startVolPos, v1);
                this.partB.src = this.insert(this.partA.src, endFreqPos, f2);
                this.partB.src = this.insert(this.partA.src, endVolPos, v2);
                this.partB.src = this.insert(this.partA.src, durationPos, ms2);
            }
            if (this.playPartC) {   // adjust PartC frequencies, volumes and duration 
                this.partC.src = this.insert(this.partA.src, startFreqPos, f2);
                this.partC.src = this.insert(this.partA.src, startVolPos, v2);
                this.partC.src = this.insert(this.partA.src, endFreqPos, f3);
                this.partC.src = this.insert(this.partA.src, endVolPos, v3);
                this.partC.src = this.insert(this.partA.src, durationPos, ms3);

            }

            // now for the actual performance...
            control.raiseEvent(FLEXFX_ACTIVITY_id, Status.STARTING) // e.g. to synchronise opening displayed mouth
            if (this.playPartA) {
                music.playSoundEffect(this.partA.src, SoundExpressionPlayMode.UntilDone);
            }
            if (this.playPartB) {
                music.playSoundEffect(this.partB.src, SoundExpressionPlayMode.UntilDone);
            } else {
                if (this.skipPartB) {   //   ...a silent gap in the middle...
                    basic.pause(ms * this.timeRatioB)
                }
            }
            if (this.playPartC) {
                music.playSoundEffect(this.partC.src, SoundExpressionPlayMode.UntilDone);
            }
            control.raiseEvent(FLEXFX_ACTIVITY_id, Status.FINISHED); // e.g. to synchronise closing displayed mouth
        }
    }



    // ***** Central array of currently defined FlexFX objects *****
    let flexFXList: FlexFX[] = [];

    /*** ADVANCED UI BLOCKS ***/
    //% block="perform FlexFX $id at pitch $pitch with strength $strength for $ms ms"
    //% group="Advanced"
    //% advanced=true
    export function performFlexFX(id: string, pitch: number, vol: number, ms: number) {

        let target: FlexFX = flexFXList.find(i => i.id === id)
        if (target != null) {
            target.performUsing(pitch, vol, ms);
        }

    }

    //% block="create simple FlexFX called $id using wave-shape $wave with attack $attack and effect $effect|pitch profile goes from $startPitchRatio to $endPitchRatio|volume profile goes from $startVolRatio to $endVolRatio"
    //% group="Advanced"
    //% advanced=true
    export function createFlexFX(
        id: string, startPitchRatio: number, startVolRatio: number,
        wave: number, attack: number, effect: number, endPitchRatio: number, endVolRatio: number) {
        // select or create target...        
        let target: FlexFX = flexFXList.find(i => i.id === id)
        if (target == null) {
            target = new FlexFX(id);
            flexFXList.push(target);
        }
        target.setPartA(startPitchRatio, startVolRatio, wave, attack, effect, endPitchRatio, endVolRatio, 1.0);
    }


    //% block="create 2-part FlexFX called $id first using wave-shape $waveA with attack $attackA and effect $effectA|then using wave-shape $waveB with attack $attackB and effect $effectB|pitch profile goes from $startPitchRatio to $midPitchRatio to $endPitchRatio|volume profile goes from $startVolRatio to $midVolRatio to $endVolRatio|first part uses timeRatioA of duration"
    //% group="Advanced"
    //% advanced=true
    export function create2PartFlexFX(
        id: string, startPitchRatio: number, startVolRatio: number,
        waveA: number, attackA: number, effectA: number, midPitchRatio: number, midVolRatio: number,
        waveB: number, attackB: number, effectB: number, endPitchRatio: number, endVolRatio: number, timeRatioA: number) {
        // select or create target...        
        let target: FlexFX = flexFXList.find(i => i.id === id)
        if (target == null) {
            target = new FlexFX(id);
            flexFXList.push(target);
        }
        target.setPartA(startPitchRatio, startVolRatio, waveA, attackA, effectA, midPitchRatio, midVolRatio, timeRatioA);
        target.setPartB(waveB, attackB, effectB, endPitchRatio, endVolRatio, 1.0 - timeRatioA);

    }

    //% block="create 3-part FlexFX called $id first using wave-shape $waveA with attack $attackA and effect $effectA|then using wave-shape $waveB with attack $attackB and effect $effectB|then using wave-shape $waveC with attack $attackC and effect $effectC|pitch profile goes from $startPitchRatio to $pitchABRatio to $pitchBCRatio to $endPitchRatio|volume profile goes from $startVolRatio to $volABRatio to $volBCRatio to $endVolRatio|first part uses $timeRatioA of duration, second part uses $timeratioB of it"
    //% group="Advanced"
    //% advanced=true
    export function create3PartFlexFX(
        id: string, startPitchRatio: number, startVolRatio: number,
        waveA: number, attackA: number, effectA: number, pitchABRatio: number, volABRatio: number,
        waveB: number, attackB: number, effectB: number, pitchBCRatio: number, volBCRatio: number,
        waveC: number, attackC: number, effectC: number, endPitchRatio: number, endVolRatio: number,
        timeRatioA: number, timeRatioB: number) {
        // select or create target...        
        let target: FlexFX = flexFXList.find(i => i.id === id)
        if (target == null) {
            target = new FlexFX(id);
            flexFXList.push(target);
        }
        target.setPartA(startPitchRatio, startVolRatio, waveA, attackA, effectA, pitchABRatio, volABRatio, timeRatioA);
        target.setPartB(waveB, attackB, effectB, pitchBCRatio, volBCRatio, timeRatioB);
        target.setPartC(waveC, attackC, effectC, endPitchRatio, endVolRatio, 1.0 - timeRatioA - timeRatioB);

    }


    // two FlexFx parts, separated by a silence.
    export function createDoubleFlexFX(
        id: string, startPitchARatio: number, startVolARatio: number,
        waveA: number, attackA: number, effectA: number, endPitchARatio: number, endVolARatio: number,
        startPitchBRatio: number, startVolBRatio: number,
        waveB: number, attackB: number, effectB: number, endPitchBRatio: number, endVolBRatio: number,
        timeRatioA: number, timeGapRatio: number) {

        // select or create target...        
        let target: FlexFX = flexFXList.find(i => i.id === id)
        if (target == null) {
            target = new FlexFX(id);
            flexFXList.push(target);
        }
        target.setPartA(startPitchARatio, startVolARatio, waveA, attackA, effectA, endPitchARatio, endVolARatio, timeRatioA);
        target.silentPartB(startPitchBRatio, startVolBRatio, timeGapRatio);
        target.setPartC(waveB, attackB, effectB, endPitchBRatio, endVolBRatio, 1.0 - timeRatioA - timeGapRatio);

    }
    enum MoodSound {
        //% block="Tweet"
        TWEET = "TWEET",
        //% block="Laugh"
        LAUGH = "LAUGH",
        //% block="Snore"
        SNORE = "SNORE",
        //% block="Doo"
        DOO = "DOO",
        //% block="Eh?"
        QUERY = "QUERY",
        //% block="Uh-oh"
        UHOH = "UHOH",
        //% block="Moan"
        MOAN = "MOAN",
        //% block="Duh!"
        DUH = "DUH",
        //% block="Waah"
        WAAH = "WAAH",
        //% block="Growl"
        GROWL = "GROWL"
    }

    // *******************Create Built-in FlexFXs************************************

    /*
        Short-hand definitions are laid out as follows:
        <name>             <%Freq,%vol>    at start of PartA
        <PartA wave-style> <%Freq,%vol>    at end of PartA & start of PartB (if used)
        <PartB wave-style> <%Freq,%vol>    at end of PartB & start of PartC (if used)
        <PartC wave-style> <%Freq,%vol>    at end of PartC (if used)
    
        The right-hand column shows the timing breakdown
        */
    /*
    
    TWEET         80% 45% 
    SIN LOG NONE 100% 80%    | 100%
    */
    createFlexFX("TWEET", 0.8, 0.45, Wave.SINE, Attack.FAST, Effect.NONE, 1.00, 0.8);


    /*
    LAUGH         70%  40%  
    SAW LOG NONE 100% 100%   | 90%
    SQU LIN NONE  70%  75%   | 10%
    */
    create2PartFlexFX("LAUGH", 0.70, 0.4,
        Wave.SAWTOOTH, Attack.FAST, Effect.NONE, 1.00, 1.0,
        Wave.SQUARE, Attack.SLOW, Effect.NONE, 0.7, 0.75, 0.9);

    /*
    SNORE       3508  10% 
    NOI VIB LIN  715 100%   | 50%
    NOI VIB LIN 5008   0%   | 50%
    NOTE: The noise-generator is highly sensitive to the chosen frequency-trajectory, and these strange values have been experimentally derived.
    By always invoking Snore.performUsing() with the scaling-factor (freq=1), these literal frequencies will get used as specified here!
    */
    create2PartFlexFX("SNORE", 3508, 0.1,
        Wave.NOISE, Attack.SLOW, Effect.VIBRATO, 715, 1.0,
        Wave.NOISE, Attack.SLOW, Effect.VIBRATO, 5008, 0, 0.50);

    /*
    DOO          300% 80% 
    SAW NONE LOG 100% 90%   |  5%
    SQU NONE LIN 100% 70%   | 95%
    */
    create2PartFlexFX("DOO", 3.00, 0.8,
        Wave.SAWTOOTH, Attack.FAST, Effect.NONE, 1.00, 0.9,
        Wave.SQUARE, Attack.SLOW, Effect.NONE, 1.00, 0.7, 0.05);

    /*
    QUERY        110%  20% 
    SQU NONE LIN 100% 100%   | 20%
    SQU NONE CUR 150%  20%   | 80%
    */
    create2PartFlexFX("QUERY", 1.10, 0.2,
        Wave.SQUARE, Attack.SLOW, Effect.NONE, 1.00, 1.0,
        Wave.SQUARE, Attack.MEDIUM, Effect.NONE, 1.50, 0.2, 0.2);

    /*
    
    UHOH         110%  40% 
    SAW NONE LOG 140% 100%   | 25%
    SILENCE                  | 20%
                 100%  80% 
    SQU NONE LIN  80%  75%   | 55%
    */
    createDoubleFlexFX("UHOH",
        1.10, 0.4, Wave.SAWTOOTH, Attack.FAST, Effect.NONE, 1.40, 1.0,
        1.00, 0.8, Wave.SQUARE, Attack.SLOW, Effect.NONE, 0.80, 0.75,
        0.25, 0.2);

    /*
    MOAN         130%  60%
    TRI NONE CUR 100% 100%   | 30%
    TRI NONE CUR  95%  80%   | 60%
    TRI NONE LIN 115%  55%   | 10%
    */
    create3PartFlexFX("MOAN", 1.30, 0.6,
        Wave.TRIANGLE, Attack.MEDIUM, Effect.NONE, 1.00, 1.0,
        Wave.TRIANGLE, Attack.MEDIUM, Effect.NONE, 0.95, 0.8,
        Wave.TRIANGLE, Attack.SLOW, Effect.NONE, 1.15, 0.55, 0.3, 0.6);

    /*
    DUH          100%  60%
    SQU NONE LIN  95%  80%   | 10%
    SQU NONE LIN 110% 100%   | 30%
    SQU NONE LIN  66%  40%   | 60%
    */
    create3PartFlexFX("DUH", 1.00, 0.6,
        Wave.SQUARE, Attack.SLOW, Effect.NONE, 0.95, 0.8,
        Wave.SQUARE, Attack.SLOW, Effect.NONE, 1.10, 1.0,
        Wave.SQUARE, Attack.SLOW, Effect.NONE, 0.66, 0.4, 0.1, 0.3);

    /*
    WAAH         100% 10%
    SAW NONE CUR 140% 90%   | 20%
    SAW NONE LIN 110% 20%   | 70%
    SAW NONE LIN  30%  5%   | 10%
    */
    create3PartFlexFX("WAAH", 1.00, 0.1,
        Wave.SAWTOOTH, Attack.MEDIUM, Effect.NONE, 1.40, 0.9,
        Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 1.10, 0.2,
        Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 0.3, 0.05, 0.20, 0.70);

    /*
    GROWL         30%  50%
    SAW NONE LOG 100%  80%   | 15%
    SAW NONE LIN  90% 100%   | 60%
    SAW NONE LIN  30%  75%   | 15%
    */
    create3PartFlexFX("GROWL", 0.30, 0.5,
        Wave.SAWTOOTH, Attack.FAST, Effect.NONE, 1.00, 0.8,
        Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 0.90, 1.0,
        Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 0.30, 0.75, 0.15, 0.60);

/*** SIMPLE UI BLOCKS ***/

    //% block="emit $builtin || at pitch $pitch with strength $strength for $duration ms"
    //% expandableArgumentMode="toggle"
    //% pitch.min=100 pitch.max=800 pitch.defl=300
    //% strength.min=0 strength.max=255 strength.defl=180
    //% duration.min=50 duration.max=9999 duration.defl=1000
    export function emit(builtIn:MoodSound, pitch: number, strength: number, duration: number) {
        // select builtin target... 
        let target: FlexFX = flexFXList.find(i => i.id === builtIn)
        if (target != null) {
            target.performUsing(pitch, strength, duration);
        }
    }

    //% block="hum || $repeat times with strength $strength over $duration ms"
    //% expandableArgumentMode="toggle"
    //% repeat.min=1 repeat.max=100 repeat.defl=10
    //% strength.min=0 strength.max=255 strength.defl=180
    //% duration.min=1 duration.max=9999 duration.defl=2000
    export function hum(repeat: number = 10, strength: number = 180, duration: number = 2000) {
        quiet = false
        ave = duration / repeat
        pitch = randint(200, 350)
        let skip = true
        for (let index = 0; index < repeat; index++) {
            span = randint(0.2 * ave, 1.8 * ave)
            if ((span > 0.6 * ave) || (skip)) {
                // mostly "Dum"...
                performFlexFX("DOO", randint(150, 300), strength, span)
                basic.pause(100)
                skip = false
            } else {
                // .. with occasional short, higher-pitched "Di"
                performFlexFX("DOO", randint(350, 500), strength, 0.25 * ave)
                basic.pause(50)
                skip = true
            }
        }
        quiet = true
    }

    //% block="grumble || $repeat times with strength $strength over $duration ms"
    //% expandableArgumentMode="toggle"
    //% repeat.min=1 repeat.max=100 repeat.defl=5
    //% strength.min=0 strength.max=255 strength.defl=250
    //% duration.min=1 duration.max=9999 duration.defl=3000
    export function grumble(repeat: number = 5, strength: number = 250, duration: number = 3000) {
        quiet = false
        ave = duration / repeat
        basic.showIcon(IconNames.Sad)
        for (let index = 0; index < repeat; index++) {
            span = randint(0.4 * ave, 1.8 * ave)
            if (span > 1.0 * ave) {
                performFlexFX("DUH", randint(150, 300), strength, 0.5 * span)
            } else {
                performFlexFX("UHOH", randint(100, 200), strength, 2 * span)
            }
            pause(0.5 * span)
        }
        quiet = true
    }

    //% block="giggle || $repeat times with strength $strength over $duration ms"
    //% expandableArgumentMode="toggle"
    //% repeat.min=1 repeat.max=100 repeat.defl=12
    //% strength.min=0 strength.max=255 strength.defl=200
    //% duration.min=1 duration.max=9999 duration.defl=4000
    export function giggle(repeat: number = 12, strength: number = 200, duration: number = 2000) {
        quiet = false
        ave = duration / repeat
        pitch = randint(500, 700)
        for (let index = 0; index < repeat; index++) {
            span = randint(0.4 * ave, 1.8 * ave)
            performFlexFX("LAUGH", pitch, strength, span)
            pitch = 0.9 * pitch
            basic.pause(100)
        }
        quiet = true
    }

    //% block="whistle || $repeat times with strength $strength over $duration ms"
    //% expandableArgumentMode="toggle"
    //% repeat.min=1 repeat.max=100 repeat.defl=8
    //% strength.min=0 strength.max=255 strength.defl=180
    //% duration.min=1 duration.max=9999 duration.defl=2500
    export function whistle(repeat: number = 8, strength: number = 180, duration: number = 2500) {
        quiet = false
        ave = duration / repeat
        for (let index = 0; index < repeat; index++) {
            span = randint(0.4 * ave, 1.8 * ave)
            performFlexFX("TWEET", randint(600, 1200), strength, span)
            basic.pause(100)
        }
        quiet = true
    }

    //% block="snore || $repeat times with strength $strength over $duration ms"
    //% expandableArgumentMode="toggle"
    //% repeat.min=1 repeat.max=100 repeat.defl=8
    //% strength.min=0 strength.max=255 strength.defl=150
    //% duration.min=1 duration.max=9999 duration.defl=5000
    export function snore(repeat: number = 8, strength: number = 150, duration: number = 5000) {
        quiet = false
        ave = duration / repeat
        for (let index = 0; index < repeat; index++) {
            span = randint(0.9 * ave, 1.1 * ave)
            performFlexFX("SNORE", 1, 80, 0.3 * span);
            pause(300);
            performFlexFX("SNORE", 1, 150, 0.7 * span);
            pause(500);
        }
        quiet = true
    }

    //% block="whimper || $repeat times with strength $strength over $duration ms"
    //% expandableArgumentMode="toggle"
    //% repeat.min=1 repeat.max=100 repeat.defl=10
    //% strength.min=0 strength.max=255 strength.defl=100
    //% duration.min=1 duration.max=9999 duration.defl=4000
    export function whimper(repeat: number = 10, strength: number = 100, duration: number = 4000) {
        if (quiet) {
            quiet = false
            ave = duration / repeat
            for (let index = 0; index < repeat; index++) {
                performFlexFX("MOAN", randint(250, 400), strength, randint(0.7 * ave, 1.3 * ave))
                basic.pause(300)
            }
            quiet = true
        }
    }

    //% block="cry || $repeat times with strength $strength over $duration ms"
    //% expandableArgumentMode="toggle"
    //% repeat.min=1 repeat.max=100 repeat.defl=8
    //% strength.min=0 strength.max=255 strength.defl=200
    //% duration.min=1 duration.max=9999 duration.defl=3000
    export function cry(repeat: number = 8, strength: number = 200, duration: number = 3500) {
        if (quiet) {
            quiet = false
            ave = duration / repeat
            for (let index = 0; index < repeat; index++) {
                span = randint(0.6 * ave, 1.5 * ave)
                if (span > 0.9 * ave) {
                    performFlexFX("MOAN", randint(200, 350), 1.5 * strength, 0.5 * span)
                } else {
                    performFlexFX("WAAH", randint(250, 400), 0.05 * strength, 1.3 * span)
                }
                basic.pause(200)
            }
            quiet = true
        }
    }

    //% block="shout || $repeat times with strength $strength over $duration ms"
    //% expandableArgumentMode="toggle"
    //% repeat.min=1 repeat.max=100 repeat.defl=5
    //% strength.min=0 strength.max=255 strength.defl=250
    //% duration.min=1 duration.max=9999 duration.defl=2500
    export function shout(repeat: number = 5, strength: number = 250, duration: number = 2500) {
        if (quiet) {
            quiet = false
            ave = duration / repeat
            for (let index = 0; index < repeat; index++) {
                performFlexFX("GROWL", randint(320, 400), strength, randint(0.8 * ave, 1.2 * ave))
                basic.pause(300)
            }
            quiet = true
        }
    }
}
// *********** test codes **********

function doSound(choice: number) {
    switch (choice) {
        case 1: flexFX.shout();
            break;
        case 2: flexFX.cry();
            break;
        case 3: flexFX.whimper();
            break;
        case 4: flexFX.snore();
            break;
        case 5: flexFX.whistle();
            break;
        case 6: flexFX.giggle();
            break;
        case 7: flexFX.grumble();
            break;
        case 8: flexFX.hum()
    }
    basic.pause(1000)
}

let quiet = true
let span = 0
let pitch = 0
let ave = 0
let choice = 7
music.setBuiltInSpeakerEnabled(false)

input.onButtonPressed(Button.A, function () {
    choice = (++choice) % 8;
    basic.showNumber(choice + 1);
})
input.onButtonPressed(Button.B, function () {
    doSound(choice + 1);
})
