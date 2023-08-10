```package
morse=github:grandpabond/pxt-flexfx
```

# FlexFX Extension: Flexible Sound-effects

The ``|music:Music|`` category has a ``||music:micro:bit(V2)||`` section with blocks for **sound-expressions**. 
These let you build some amazing sounds, but sometimes you need something more complex.
``|flexFX:flexFX|`` sounds are *re-usable recipes* for sound-effects that can stitch together up to three sound-expressions, to be played one after the other.
As its name suggests, a``|flexFX:flexFX|`` recipe is used flexibly, creating different performances simply by changing the parameters for pitch, volume or duration.


## Performing a FlexFX #performFlexFX
Each FlexFX has a unique name (its **id**), assigned when it is first created.

This is supplied to the block ``|flexFX:performFlexFX|``, together with your chosen play-settings:

``||flexFX:pitch||`` sets the basic pitch as a numeric frequency.

``||flexFX:volume||`` sets the basic volume as a number in the range 0-255.

``||flexFX:duration||`` sets how long the overall performance will last in milliseconds.

You can choose a FlexFX from a selection of built-in sounds, or create your own *(see below)*

Often, a sound-effect is intended to accompany other actions that require codes to be executed, so there is a final optional parameter ``||flexFX:background||``that (if set *true*) allows the FlexFX to be performed in the background *(see |Play-list| below)*.

The following example would play the built-in FlexFX called **Ping** quietly, based on a pitch around middle-C, 
with the whole performance lasting 1.5 seconds:

```block
flexFX.performFlexFX("Ping", 250, 50, 1500, false);
```


## Anatomy of a FlexFX
The basic idea is that a FlexFX is built from one, two or three **parts**.
Each part is a sound-expression that takes a particular **style** of sound and varies its **[pitch,volume]** 
parameters from a start-point to an end-point, over some period of time. Note that each part can use a different 
style of sound, specified by its own **wave-shape**, **attack**, plus a possible **effect**.

### Style: Wave-shape
The wave-shape sets the basic tonal quality: the spikier the wave, the harsher the sound. There are five shapes available:

``||flexFX:Pure||`` selects a Sine-wave, a smooth, clean shape giving a smooth, clean tone.

``||flexFX:Buzzy||`` selects a Square-wave containing harmonics, partial tones that are multiples (in this case 3,5,7...) of the main frequency. This gives a square wave a richer and buzzier sound.

``||flexFX:Bright||`` selects a Triangular-wave containing the same odd harmonics as a square wave, but with the higher ones tapering off. It sounds clear and bright.

``||flexFX:Harsh||`` selects a Sawtooth-wave which is the richest in terms of harmonics, making it sound even harsher than a square wave,

``||flexFX:Noisy||`` selects a randomised wave-shape that takes harshness to the extreme: it doesn't have any real pitch left at all!

### Style: Attack
The attack chooses how fast the pitch and volume move from the start-point to the end-point of the FlexFX part.

``||flexFX:Slow||`` selects a simple straight-line path, changing evenly over time.

``||flexFX:Medium||`` follows a curved path, changing more quickly to start with, then gradually slowing down.

``||flexFX:Fast||`` gives the most extreme attack, moving very rapidly away from the start-point towards the end-point. 

### Style: Effect
There are three special-effects that can optionally be added.

``||flexFX:Vibrato||`` wobbles the pitch up and down as it progresses.

``||flexFX:Tremolo||`` flutters the volume throughout.

``||flexFX:Warble||`` is a rather more extreme version of Vibrato.

``||flexFX:None||`` skips any of these effects.

There is currently no control of how rapidly or deeply these effects are applied.

### Profiles
A FlexFX stitches its parts together, so that the end-point of one part forms the start-point of the next part.
This means that its pitch will vary smoothly across the parts, as will the volume. 
We call these sets of fixed points the **pitch-profile** and the **volume-profile**.

Because a FlexFX is a *tuneable* object, all of its parameters are given as **percentages** of the actual performance play-settings supplied later.
So it might start at 75% of the specified pitch (a musical fifth below), rise to 125% (a musical third above) before settling on 100%.
Similarly, it might start quietly (at 50% of the specified volume), then grow to a maximum (100%) before fading away to silence (0%). (Note that 100% of "quiet" is still quiet!)
Percentages also say how the total duration should be split between the different parts, so the same FlexFX can be performed slowly or fast. 

### Creating a Simple FlexFX #createFlexFX
The simplest FlexFX has just one part (so is really just a tuneable version of a standard sound-expression)
Here is an example:
```block
flexFX.createFlexFX("Ting", 100, 100,
    Wave.TRIANGLE, Attack.FAST, Effect.NONE, 100, 10);
```

### Creating a 2-Part FlexFX #create2PartFlexFX
A **2-part FlexFX** allows profiles passing through three [pitch,volume] settings: start, middle and end.
For example:
```block
flexFX.create2PartFlexFX("Miaow", 70, 50,
    Wave.SAWTOOTH, Attack.MEDIUM, Effect.NONE, 100, 100,
    Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 90, 80, 30);
```

### Creating a 3-Part FlexFX #create3PartFlexFX
The most complex **3-part FlexFX** has profiles that move smoothly between four points.
For example:
```block
flexFX.create3PartFlexFX("Wail", 50, 50,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 200, 100,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 100, 100,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 150, 50, 33, 33);
```

### Creating a Double FlexFX #createDoubleFlexFX
For some special sounds (e.g a two-tone police siren) we need a silent gap separating two simple sound-expressions.
This is called a **double FlexFX**. Each part has play-settings for its start-point and end-point, 
and the duration percentages controls the lengths of the first sound, and of the silence in-between.

```block
	flexFX.createDoubleFlexFX("NeeNaw", 95, 80,
		Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 100, 100,
		70, 100,
		Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 75, 80, 45, 10);
```

## Changing a FlexFX
Any FlexFX can be freely modified using any of the ``|flexFX:create...|`` blocks, by specifying its **id**. 
The basic rule is that if it exists, it gets changed; otherwise it is created from scratch.

## The Play-list

By setting the final parameter of `|flexFX:performFlexFX|` to *true*, the function will return immediately, and queue the FlexFX performance (called a **Play**) to happen in the background. In this way, you can in fact queue-up many different Plays on the internal Play-list, and the background process will just work through them one-at-a-time, while your code gets on with something else. 

Sometimes you might want tighter control over just when each queued Play occurs, so some advanced functions are provided that let you interact with the Play-list.

### Spacing-out background Plays #performSilence
	When queueing-up a series of FlexFX Plays, you may not always want them to follow-on straightaway. Use this function to space-out your Plays, by adding a silent pause onto the play-list.
	
	This example separates two Plays with a 1.5 second silence:
	
```block
	flexFX.performSilence(1500);
```
	
### Synchronise with the next Play #awaitPlayStart #awaitPlayFinish()
	If your codes need to synchronise servo actions or display changes precisely to a queued sequence of sound-effects, you can use the wait functions.
	
	flexFX.awaitPlayStart()  Awaits start of next FLexFX on the play-list

	flexFX.awaitPlayFinish() Awaits completion of FlexFX currently playing

	flexFX.awaitAllFinished()  Awaits completion of everything on the play-list

	flexFX.waitingToPlay() Returns the current length of the play-list

	flexFX.stopPlaying() Suspends background playing from the play-list

	flexFX.startPlaying() Resums background playing from the play-list

	flexFX.deletePlaylist()  Delets from the play-list everything left unplayed
	
	
	
	
	So for example this code snippet would lip-synch a crying face.
```block

// create a wailing 3-part flexFX
flexFX.create3PartFlexFX("Wail", 50, 50,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 200, 100,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 100, 100,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 150, 50, 33, 33);

// queue up some Plays on the Play-list, with pauses queued in-between
flexFX.stopPlaying();  // don't start Playing yet...
flexFX.performFlexFX("Wail", 200, 250, 1000, true);
flexFX.performSilence(2000);
flexFX.performFlexFX("Wail", 300, 250, 1000, true);
flexFX.performSilence(1500);
flexFX.performFlexFX("Wail", 400, 250, 1000, true);
flexFX.performSilence(1000);
flexFX.performFlexFX("Wail", 600, 250, 1000, true);
flexFX.performSilence(800);
flexFX.performFlexFX("Wail", 800, 250, 1000, true);
basic.showNumber(flexFX.waitingToPlay());
pause(500);
// use events to choreograph faces to sounds
basic.showIcon(IconNames.Sad);
pause(1000)
flexFX.startPlaying(); // kick off the Play-list
while(flexFX.isActive()) {
    flexFX.awaitPlayStart(); // starting the next (non-silent) Play...
    basic.showIcon(IconNames.Surprised); // ... so open the mouth
    flexFX.awaitPlayFinish();
    basic.showIcon(IconNames.Sad); // close the mouth again
    // (the active Player now "Plays" the queued silence)
}
pause(500);
basic.showIcon(IconNames.Happy);
`
-----------------------------------------------------------------------
-----------------------------------------------------------------------
# Acknowledgements 
Credit must go to Bill Siever (on the Micro:bit Developer Slack Forum) for his experienced insights into the workings of the Micro:bit run-time, and his unstinting assistance in navigating the complex process of publishing this Extension.


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
