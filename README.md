# FlexFX Extension  for  Flexible Sound-effects
The ``|music:Music|`` category has a ``||music:micro:bit(V2)||`` section with blocks for **sound-expressions**. 
These let you build some amazing sounds, but sometimes you need something more complex.
``|flexFX:FlexFX|`` sounds are *re-usable* objects that can stitch together up to three sound-expressions.
They can be **performed** using different play-settings to control the pitch, volume, or duration.

## Anatomy of a FlexFX
The basic idea is that a FlexFX is built from one, two or three **parts**.
Each part is a sound-expression that takes a particular **style** of sound and varies its **[pitch,volume]** 
parameters from a start-point to an end-point, over some period of time. Note that each part can use a different 
style of sound, specified by its own **wave-shape**, **attack** plus a possible **effect**.

### Style: Wave-shape
The wave-shape sets the basic tonal quality: the spikier the wave, the harsher the sound. There are five shapes available:

``||Pure||`` selects a Sine-wave, a smooth, clean shape giving a smooth, clean tone.

``||Buzzy||`` selects a Square-wave containing harmonics, partial tones that are multiples (in this case 3,5,7...) of the main frequency. This gives a square wave a richer and buzzier sound.

``||Bright||`` selects a Triangular-wave containing the same odd harmonics as a square wave, but with the higher ones tapering off. It sounds clear and bright.

``||Harsh||`` selects a Sawtooth-wave which is the richest in terms of harmonics, making it sound even harsher than a square wave,

``||Noisy||`` selects a randomised wave-shape that takes harshness to the extreme: it doesn't have any real pitch left at all!

### Style: Attack
The attack chooses how fast the pitch and volume move from the start-point to the end-point of the FlexFX part.

``||Slow||`` selects a simple straight-line path, changing evenly over time.

``||Medium||`` follows a curved path, changing more quickly to start with, then gradually slowing down.

``||Fast||`` gives the most extreme attack, moving very rapidly away from the start-point towards the end-point. 

### Style: Effect
There are three special-effects that can optionally be added.

``||Vibrato||`` wobbles the pitch up and down as it progresses.

``||Tremolo||`` flutters the volume throughout.

``||Warble||`` is a rather more extreme version of Vibrato.

``||None||`` skips any of these effects.

There is currently no control of how rapidly or deeply these effects are applied.

### Profiles
A FlexFX stitches-together its parts, so that the end-point of one part forms the start-point of the next part.
This means that its pitch will vary smoothly through the parts, as will the volume. 
We call these sets of fixed points the **pitch-profile** and the **volume-profile**.

Because a FlexFX is a *tuneable* object, all of its parameters are given as **percentages** of the performance play-settings.
So it might start at 75% of the specified pitch (a musical fifth below), rise to 125% (a musical third above) before settling on 100%.
Similarly, it might start quietly (at 50% volume), then grow to a maximum (100%) before fading away to silence (0%).
Percentages also say how the total duration should be split between the different parts. 

### Creating a Simple FlexFX
The simplest FlexFX has just one part (so is really just a tuneable version of a standard sound-expression)
Here is an example:
```block
flexFX.createFlexFX("Ting", 100, 100,
    Wave.TRIANGLE, Attack.FAST, Effect.NONE, 100, 10);
```

### Creating a 2-Part FlexFX
A **2-part FlexFX** allows profiles passing through three [pitch,volume] settings: start, middle and end.
For example:
```block
flexFX.create2PartFlexFX("Miaow", 70, 50,
    Wave.SAWTOOTH, Attack.MEDIUM, Effect.NONE, 100, 100,
    Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 90, 80, 30);
```

### Creating a 3-Part FlexFX
The most complex **3-part FlexFX** has profiles that move smoothly between four points.
For example:
```block
flexFX.create3PartFlexFX("SIREN", 50, 50,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 200, 100,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 100, 100,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 150, 50, 33, 33);
```

### Creating a Double FlexFX
For some special sounds (e.g a two-tone police siren) we need a silent gap separating two simple sound-expressions.
This is called a **double FlexFX**. Each part has play-settings for its start-point and end-point, 
and the duration percentages controls the lengths of the first sound, and of the silence in-between.

```block
flexFX.createDoubleFlexFX("NeeNaw", 95, 80,
    Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 100, 100,
    70, 100,
    Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 75, 80, 45, 10);
```

## Using your FlexFX 

## Performing a FlexFX 
Each FlexFX has a unique name (its **id**), assigned when it is first created. 
This is supplied to the block ``|flexFX:performFlexFX|``, together with your chosen play-settings:

``||Pitch||`` sets the basic pitch as a numeric frequency.

``||Volume||`` sets the basic volume as a number in the range 0-255.

``||Duration||`` sets how long the overall performance will last in milliseconds.

The following example would play a FlexFX called **MYSOUND** quietly, based on a pitch around middle-C, 
with the whole performance lasting 2 seconds:
```block
flexFX.performFlexFX("MYSOUND", 250, 50, 2000);
```

## Changing a FlexFX
Any FlexFX can be freely modified using any of the ``|flexFX:create...|`` blocks, by specifying its **id**. 
The basic rule is that if it exists, it gets changed; otherwise it is created from scratch.

-----------------------------------------------------------------------
-----------------------------------------------------------------------



> Open this page at [https://grandpabond.github.io/pxt-flexfx/](https://grandpabond.github.io/pxt-flexfx/)

## Use as Extension

This repository can be added as an **extension** in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **New Project**
* click on **Extensions** under the gearwheel menu
* search for **https://github.com/grandpabond/pxt-flexfx** and import

## Edit this project

To edit this repository in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **Import** then click on **Import URL**
* paste **https://github.com/grandpabond/pxt-flexfx** and click import

#### Metadata (used for search, rendering)

* for PXT/microbit
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>
