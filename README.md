# FlexFX Extension  for  Flexible Sound-effects
The **Music** category has a **micro:bit(V2)** section with blocks for **sound-expressions**. 
These let you build some amazing sounds, but sometimes you need something more complex.
**FlexFX** sounds are *re-usable* objects that can stitch together up to three sound-expressions.
They use **play-settings**, which means you can play them at different pitch, volume, or duration.
## Built-in Sounds
### Simple Sounds
These are FlexFX sounds that can be played very simply using the **emit** block:
```blocks
flexFX.emit(2);
```
Expanding this block, you can specify the play-settings to be used (with duration in ms):
```blocks
flexFX.emit(5,400,100,5000);
```
### Behaviours
Currently the built-in sounds are mostly expressive humanoid sounds, so there is a set of **behaviour** blocks
 that perform several repetitions of a FlexFX sound, with their play-settings slightly randomised to give 
 a more natural effect. The results will change with every performance.
```blocks
flexFX.giggle();
```
These blocks can be expanded to control the number of repeats, the volume, and the overall duration (in ms). 
```blocks
flexFX.whistle(30,200,12000);
```

## Anatomy of a FlexFX
The basic idea is that a FlexFX is built from one, two or three **parts**.
Each part is a sound-expression that takes a particular **style** of sound and varies its **[pitch,volume]** 
parameters from a start-point to an end-point, over some period of time. Note that each part can use a different 
style of sound, specified by three parameters: its **wave-shape**, **attack** and a possible **effect**.

### Style: Wave-shape
The wave-shape sets the basic quality: the spikier the wave, the harsher the sound. There are five shapes available:

**Pure** selects a Sine-wave -a smooth, clean shape giving a smooth, clean tone.

**Buzzy** selects a Square-wave containing harmonics, partial tones that are multiples (in this case 3,5,7...) of the main frequency). This gives a square wave a richer and buzzier sound.

**Bright** select a Triangular-wave containing the same odd harmonics as a square wave, but with the higher ones tapering off. It sounds clear and bright.

**Harsh** selects a Sawtooth-wave which is the richest in terms of harmonics, making it sound even harsher than a square wave,

**Noisy** selects a randomised wave-shape that takes harshness to the extreme: it does't really have much of a pitch left at all!

### Style: Attack
The attack chooses how the pitch and volume move from the start-point to the end-point of the FlexFX part.

**Slow** selects a simple straight-line path, changing evenly over time.

**Medium** follows a curved path, changing more quickly to start with, then gradually slowing down.

**Fast** gives the most extreme attack, moving very rapidly away from the start-point towards the end-point. 

### Style: Effect
There are three special-effects that can optionally be added to the sound.
**Vibrato** wobbles the pitch up and down as it progresses.

**Tremolo** flutters the volume throughout.

**Warble** is a rather more extreme version of Vibrato.

**None** avoids these effects,

There is currently no control of how rapidly or deeply these effects are applied.

### Profiles
A FlexFX stitches-together its parts, so the end-point of one part forms the start-point of the next part.
This means that its pitch will vary smoothly through the parts, as will the volume. 
We call these sets of fixed points the **pitch-profile** and the **volume-profile**.

As a FlexFX is a *tuneable* object, all of its parameters are given as **percentages** of the performance play-settings.
So it might start at 75% of the specified pitch (a fifth below), rise to 125% (a third above) before settling on 100%.
Similarly, it may start quietly (at 50% volume), then grow to a maximum (100%) before fading away to silence (0%).
Percentages also say how the total duration should be split between the different parts. 

## Creating Custom Sounds
Under the three-dot **... more** category are some tools for creating and performing your own FlexFX sounds.
(Building a three-part FlexFX will get really complicated, so maybe start with something simpler!)

### Performing a FlexFX 
Each FlexFX has a unique name (its **id**), assigned when it is first created. 
This is supplied to the block *performFlexFX*, together with your chosen play-settings. For example this plays **MYSOUND**
quietly, based on the pitch middle-C, with the whole performance lasting 2 seconds:
```blocks
flexFX.performFlexFX("MYSOUND", 250, 50, 2000);
```
### Simple FlexFX
The simplest FlexFX has just one part (so is really just a tuneable version of a standard sound-expression)
Here is an example:
```blocks
flexFX.createFlexFX("TEST-SIMPLE", 50, 50,
    Wave.SINE, Attack.SLOW, Effect.NONE, 100, 100);
```

### 2-Part FlexFX

```blocks
flexFX.create2PartFlexFX("TEST-2PART", 50, 50,
    Wave.TRIANGLE, Attack.SLOW, Effect.NONE, 100, 100,
    Wave.TRIANGLE, Attack.SLOW, Effect.NONE, 30, 50, 33);
```

### 3-Part FlexFX


```blocks
flexFX.create3PartFlexFX("TEST-3PART", 50, 50,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 200, 100,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 100, 100,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 150, 50, 33, 33);
```


### Double FlexFX


```blocks
flexFX.createDoubleFlexFX("TEST-DOUBLE", 95, 50,
    Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 100, 100,
    70, 100,
    Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 75, 50, 45, 10);
```







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
