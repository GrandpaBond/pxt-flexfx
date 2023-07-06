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
namespace flexFX {
    // We identify field-offsets defensively, just in case SoundExpression field-locations should 
    // change in future. (We presume their width will always be 4 digits)
    const startVolPos = 1
    const startFreqPos = 5
    const durationPos = 9
    const endVolPos = 26
    const endFreqPos = 18

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
        // This implicitly sets start values for Part B (unless skipped)
        setPartA(freq0: number, vol0: number, wave: WaveShape, shape: InterpolationCurve, fx: SoundExpressionEffect, freq1: number, vol1: number, ms1: number) {
            this.freqRatio0 = freq0;
            this.volRatio0 = vol0;
            this.freqRatio1 = freq1;
            this.volRatio1 = vol1;
            this.timeRatioA = ms1;
            this.partA = new soundExpression.Sound;
            this.partA.src = music.createSoundEffect(wave, 333, 333, 666, 666, 999, fx, shape);
            this.playPartA = true;
        }
        // Adds a silent Part B:  (Point0)--(PartA)--(Point1)--(silence)--(Point2)
        // This also implicitly sets start values for Part C
        silentPartB(freq2: number, vol2: number, ms2: number) {
            this.freqRatio2 = freq2;
            this.volRatio2 = vol2;
            this.timeRatioB = ms2;
            this.skipPartB = true;
        }
        // Adds a non-silent Part B, implicitly setting start values for Part C
        setPartB(wave: WaveShape, shape: InterpolationCurve, fx: SoundExpressionEffect, freq2: number, vol2: number, ms2: number) {
            // we have a PartB:  (Point0)--(PartA)--(Point1)--(PartB)--(Point2)
            this.freqRatio2 = freq2;
            this.volRatio2 = vol2;
            this.timeRatioB = ms2;
            this.partB = new soundExpression.Sound;
            this.partB.src = music.createSoundEffect(wave, 333, 333, 666, 666, 999, fx, shape);
            this.playPartB = true
            this.usesPoint2 = true;
        }

        // Adds an optional part C: (Point0)--(PartA)--(Point1)--(PartB)--(Point2)--(PartC)--(Point3)
        setPartC(wave: WaveShape, shape: InterpolationCurve, fx: SoundExpressionEffect, freq3: number, vol3: number, ms3: number) {
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
    let flexFXList: FlexFX[] = [];

    export function createFlexFX(
            id: string,
            startPitchRatio: number,
            startVolRatio: number,
            wave: WaveShape,
            attack: InterpolationCurve,
            effect: SoundExpressionEffect,
            endPitchRatio: number,
            endVolRatio: number) {
        // select or create target...        
        let target: FlexFX = flexFXList.find(i => i.id === id)
        if (target == null){
            flexFXList.push(new FlexFX(id));
        }
        target.setPartA(startPitchRatio,startVolRatio,wave,attack,effect,endPitchRatio,endVolRatio,1.0);
    }


    export function create2PartFlexFX(
        id: string,
        startPitchRatio: number,
        startVolRatio: number,
        waveA: WaveShape,
        attackA: InterpolationCurve,
        effectA: SoundExpressionEffect,
        timeRatioA: number,
        midPitchRatio: number,
        midVolRatio: number,
        waveB: WaveShape,
        attackB: InterpolationCurve,
        effectB: SoundExpressionEffect,
        endPitchRatio: number,
        endVolRatio: number) {
        // select or create target...        
        let target: FlexFX = flexFXList.find(i => i.id === id)
        if (target == null) {
            flexFXList.push(new FlexFX(id));
        }
        target.setPartA(startPitchRatio, startVolRatio, waveA, attackA, effectA, midPitchRatio, midVolRatio, timeRatioA);
        target.setPartB( waveB, attackB, effectB, endPitchRatio, endVolRatio, 1.0-timeRatioA);

    }

    export function create3PartFlexFX(
        id: string,
        startPitchRatio: number,
        startVolRatio: number,
        waveA: WaveShape,
        attackA: InterpolationCurve,
        effectA: SoundExpressionEffect,
        timeRatioA: number,
        pitchABRatio: number,
        volABRatio: number,
        waveB: WaveShape,
        attackB: InterpolationCurve,
        effectB: SoundExpressionEffect,
        timeRatioB: number,
        pitchBCRatio: number,
        volBCRatio: number,
        waveC: WaveShape,
        attackC: InterpolationCurve,
        effectC: SoundExpressionEffect,
        endPitchRatio: number,
        endVolRatio: number) {
        // select or create target...        
        let target: FlexFX = flexFXList.find(i => i.id === id)
        if (target == null) {
            flexFXList.push(new FlexFX(id));
        }
        target.setPartA(startPitchRatio, startVolRatio, waveA, attackA, effectA, pitchABRatio, volABRatio, timeRatioA);
        target.setPartB(waveB, attackB, effectB, pitchBCRatio, volBCRatio, timeRatioB);
        target.setPartC(waveC, attackC, effectC, endPitchRatio, endVolRatio, 1.0 - timeRatioA - timeRatioB);

    }


    // two FlexFx parts, separated by a silence.
    export function createDoubleFlexFX(
        id: string,
        startPitchARatio: number,
        startVolARatio: number,
        waveA: WaveShape,
        attackA: InterpolationCurve,
        effectA: SoundExpressionEffect,
        timeRatioA: number,
        endPitchARatio: number,
        endVolARatio: number,
        timeGapRatio: number,
        startPitchBRatio: number,
        startVolBRatio: number,
        waveB: WaveShape,
        attackB: InterpolationCurve,
        effectB: SoundExpressionEffect,
        endPitchBRatio: number,
        endVolBRatio: number) {
    
        // select or create target...        
        let target: FlexFX = flexFXList.find(i => i.id === id)
        if (target == null) {
            flexFXList.push(new FlexFX(id));
        }
        target.setPartA(startPitchARatio, startVolARatio, waveA, attackA, effectA, endPitchARatio, endVolARatio, timeRatioA);
        target.silentPartB(startPitchBRatio, startVolBRatio, timeGapRatio);
        target.setPartC(waveB, attackB, effectB, endPitchBRatio, endVolBRatio, 1.0 - timeRatioA - timeGapRatio);

    }



}
