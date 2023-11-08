```package
pxt-flexfx=github:grandpabond/pxt-flexfx
```
# FlexFX - Flexible Sound-effect Recipes
Many microbit projects can be brought to life by adding sound-effects to indicate their state.

The ``||music:Music||`` category has a ``||music:micro:bit(V2)||`` section with blocks for **sound-expressions**. 
These let you build some amazing sounds, but sometimes you need something a bit more complex.

A ``||flexFX:flexFX||`` provides a "sound journey", following a sonic path through time that 
flows smoothly between fixed [pitch, volume] points, simultaneously tracking the pitch-profile 
and the volume-profile. It stitches together multiple sound-expressions to be played one after the 
other, giving a smoothly varying result. 

As its name suggests, a ``||flexFX:flexFX||`` recipe can be re-used flexibly, with different performances
(or **Plays**) independently scaling these profiles and stretching or shrinking the duration.

You can choose a ``||flexFX:flexFX||`` to play from a drop-down list of built-in sounds, and you can either wait for it 
to finish, or you can let it play in the background while executing other code. If it hasn't finished when you 
play another one, the new Play will be added to a **Play-list**, so you can queue-up several performances to happen 
in the background.

A ``||flexFX:flexFX||`` can also be used to play a melody. There is a small selection of built-in tunes,
or you can compose your own. (see ``||flexFX:Playing Tunes||`` below).

You can interact with this Play-list to synchronise the sound-track with your other codes 
(see 

If you need a sound that is not built-in, you can even create your own (see ``||flexFX:Building a FlexFX||`` below).

# Playing a selected FlexFX #flexFX-playBuiltInFlexFX
```sig
flexFX.playBuiltInFlexFX()
```
Use the drop-down list on ``||FlexFX:playBuiltInFlexFX||`` to choose which built-in ``||flexFX:flexFX||`` to hear. 
By repeatedly clicking on the "+" you can access three additional parameters to change the pitch, 
volume or duration of this Play. These extra parameters are described in detail for the ``||FlexFX:playFlexFX||`` 
block below...

# Playing a named FlexFX #flexFX-playFlexFX            
```sig
flexFX.playFlexFX()
```
This function lets you play a ``||flexFX:flexFX||`` chosen by name (or identifier)

``||flexFX:id||`` is the unique identifier assigned when created (whether built-in or created by you)

``||flexFX:wait||`` is a switch. If **"True"**, the sound is played to completion. If **"False"**, 
it is added to the Play-list to be played in the background.

As with the ``||FlexFX:playBuiltInFlexFX||`` block (above), if you click on the "+" extender, 
you can expose an extra performance parameter:

``||flexFX:pitchSteps||``  lets you change the pitch up or down. It is specified in musical semitone 
steps.

By clicking on the "+" extender repeatedly, you can also specify two more performance parameters:

``||flexFX:volumeLimit||`` sets the peak volume as a number in the range 0-255.

``||flexFX:newDuration||`` sets how long the overall performance will last in milliseconds.

### ~reminder
#### Pitch Steps
If you double all the frequencies used in a ``||flexFX:flexFX||``, it will sound an octave higher.
On a piano, moving up by an octave requires 12 semitone steps (counting both black and white keys).
So you might set ``||flexFX:pitchSteps||`` to +12 to raise its pitch by an octave, or to -12 to lower it
by an octave. (Using +60 would make it 5 octaves higher!) For finer adjustments, you can even use 
a fractional number.
### ~

The following example would play the built-in FlexFX called **"chime"** three times over, 
with descending pitch, and increasing volume. The first two performances last just 0.4 seconds each, 
while the final performance takes 1.6 seconds to complete.

```block
flexFX.playFlexFX("chime", 7, 100, 400);
flexFX.playFlexFX("chime", 5, 175, 400);
flexFX.playFlexFX("chime", 0, 250, 1600);
```

# Background Play-list
Often, a sound-effect is intended to accompany other actions that require codes to be executed.

By switching the final optional parameter of ``||flexFX:playBuiltInFlexFX||`` or ``||flexFX:playFlexFX||`` 
to **true**, the function will return immediately, and queue this FlexFX performance 
(which we call a ``||flexFX:Play||``) to happen in the background. 

You can queue-up many different ``||flexFX:Plays||`` on the internal ``||flexFX:Play-list||``, 
and the background process will just work steadily through them one-at-a-time, 
allowing your code to get on with something else. 

Sometimes you might want tighter control over just when each queued ``||flexFX:Play||`` occurs, so various blocks 
are provided that let you interact with the ``||flexFX:Play-list||``.

## Spacing-out background Plays  #flexFX-playSilence                
```sig
flexFX.playSilence()
```

When queueing-up a series of ``||flexFX:Plays||``, you may not always want them to follow-on straightaway. 

Use this function to space-out your ``||flexFX:Plays||``, by adding a silent pause onto the ``||flexFX:Play-list||``.

This example plays three bell-sounds in the background, separated by gaps of 1.5 seconds:
```block
    flexFX.playFlexFX("ting", Note.G5, 100, 400, true);
	flexFX.playSilence(1500);
    flexFX.playFlexFX("ting", Note.E5, 175, 400, true);
	flexFX.playSilence(1500);
    flexFX.playFlexFX("ting", Note.C5, 250, 1600, true);
;
```
	
## Waiting for the Play-list...
If your codes need to synchronise other activites (such as servo-actions or display-changes)  precisely 
to the performance of a queued sequence of sound-effects, you can use one of these **wait** blocks:

## Waiting for the next Play to start  #flexFX-awaitPlayStart
```sig
	flexFX.awaitPlayStart()  
```
Awaits start of the next FlexFX performance on the ``||flexFX:Play-list||``. (Returns immediately if there is none.)

## Waiting for the current Play to finish  #flexFX-awaitPlayFinish
```sig
	flexFX.awaitPlayFinish() 
```
Awaits completion of the FlexFX performance currently playing. (Returns immediately if there is none.)

## Waiting for the whole Play-list to finish  #flexFX-awaitAllFinished
```sig
	flexFX.awaitAllFinished()  
```
Awaits completion of everything on the ``||flexFX:Play-list||``.  (Returns immediately if there is none.)

## Pausing play-back of the Play-list  #flexFX-stopPlaying
```sig
	flexFX.stopPlaying() 
```
You can also stop and later re-start the background ``||flexFX:Play-list||``:
``||flexFX:stopPlaying||`` suspends future background playing from the ``||flexFX:Play-list||`` (once any current ``||flexFX:Play||`` has finished).

## Playing the rest of the Play-list  #flexFX-startPlaying
```sig
	flexFX.startPlaying() 
```
This unlocks the ``||flexFX:Play-list||``, resuming background playing of any queued (or future) ``||flexFX:Plays||``.  

## Checking how many Plays remain on the Play-list  #flexFX-waitingToPlay
```sig
	flexFX.waitingToPlay(): number 
```
Sometimes it may be important for your codes to know how far the ``||flexFX:Play-list||`` has got.
This reporter block returns the current length of the (unplayed) ``||flexFX:Play-list||``.

## Abandoning a Play-list you don't need any more  #flexFX-deletePlaylist
```sig 
	flexFX.deletePlaylist()  
```
Deletes from the ``||flexFX:Play-list||`` everything left unplayed.
	
# Lip-sync Example
So for example this code snippet would choreograph a crying face, alternating the two icons to achieve lip-sync. 

The code queues up some ``||flexFX:Plays||`` of the built-in FlexFX "cry" on the ``||flexFX:Play-list||``, 
with different pauses queued in-between. Note that by calling ``||flexFX:stopPlaying||`` first, 
we prevent the first ``||flexFX:Plays||`` happening until we are ready to  ``||flexFX:startPlaying||``. 
Within the loop, we use ``||flexFX:awaitPlayStart||`` and ``||flexFX:awaitPlayFinish||`` to synchronise the mouth-changes.
```block
// first queue up some Plays on the Play-list, with pauses queued in-between
flexFX.stopPlaying();  // don't start Playing yet...
flexFX.playFlexFX("cry", 200, 250, 1000, true);
flexFX.playSilence(2000);
flexFX.playFlexFX("cry", 300, 250, 1000, true);
flexFX.playSilence(1500);
flexFX.playFlexFX("cry", 400, 250, 1000, true);
flexFX.playSilence(1000);
flexFX.playFlexFX("cry", 600, 250, 1000, true);
flexFX.playSilence(800);
flexFX.playFlexFX("cry", 800, 250, 1000, true);
basic.showNumber(flexFX.waitingToPlay());
basic.pause(500);
// use events to choreograph faces to sounds
basic.showIcon(IconNames.Sad);
basic.pause(1000)
flexFX.startPlaying(); // kick off the Play-list
while(flexFX.waitingToPlay() > 0) {
    flexFX.awaitPlayStart(); // starting the next (non-silent) Play...
    basic.showIcon(IconNames.Surprised); // ... so open the mouth
    flexFX.awaitPlayFinish();
    basic.showIcon(IconNames.Sad); // close the mouth again
    // (the background Player now "plays" the queued silence)
}
basic.pause(500);
basic.showIcon(IconNames.Happy);
```

# Building a FlexFX
There are lots of ``||flexFX:flexFX||`` sounds already built-in, but if you wanted something different
there are some advanced blocks (under ``||FlexFX:more...||``) that will let you build your own from scratch.

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

``||flexFX:Silence||`` is an option that allows you to put silent gaps into your sound.

### Style: Attack
The attack chooses how fast the pitch moves from the start-point to the end-point of the FlexFX part.

``||flexFX:Fast||`` gives an extreme percussive attack, moving very rapidly away from the start-point towards the end-point. 

``||flexFX:Medium||`` follows a curved path, changing more quickly to start with, then gradually slowing down.

``||flexFX:Slow||`` selects a simple straight-line path, changing evenly over time.

``||flexFX:Delayed||`` moves slowly away from the start-point, accelerating with time.

### Style: Effect
There are three special-effects that can optionally be added.

``||flexFX:Vibrato||`` wobbles the pitch up and down as it progresses.

``||flexFX:Tremolo||`` flutters the volume throughout.

``||flexFX:Warble||`` is a rather more extreme version of Vibrato.

``||flexFX:None||`` skips any of these effects.

There is currently no control of how rapidly or deeply these effects are applied. (This functionality would be a welcome upgrade).

### Profiles
A FlexFX stitches its parts together, so that the end-point of one part forms the start-point of the next part.

This means that its pitch will vary smoothly across the parts, as will the volume. 

We call these sets of fixed points the **pitch-profile** and the **volume-profile**.

Because a FlexFX is a *tuneable* object, all of its parameters are given as **percentages** of the actual performance play-settings supplied later.

So it might start at 75% of the specified pitch (a musical fifth below), rise to 125% (a musical third above) before settling on 100%.

Similarly, it might start quietly (at 50% of the specified volume), then grow to a maximum (100%) before fading away to silence (0%). (Note that 100% of "quiet" is still quiet!)

Percentages also say how the total duration should be split between the different parts, so the same FlexFX can be performed slowly or fast. 

## Creating a Simple FlexFX #flexFX-createFlexFX

```sig
flexFX.createFlexFX()
```
The simplest FlexFX has just one part (so is really just a tuneable version of a standard sound-expression)

Here is an example:
```block
flexFX.createFlexFX("Bell", 100, 100,
    Wave.TRIANGLE, Attack.FAST, Effect.NONE, 100, 10,
    500, 250, 500);
```

## Creating a 2-Part FlexFX #flexFX-create2PartFlexFX
A **2-part FlexFX** allows profiles passing through three [pitch,volume] settings: start, middle and end.

For example:
```block
flexFX.create2PartFlexFX("Cat", 70, 50,
    Wave.SAWTOOTH, Attack.MEDIUM, Effect.NONE, 100, 100,
    Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 90, 80, 30,
    300, 250, 1200);
```

## Creating a 3-Part FlexFX #flexFX-create3PartFlexFX
The most complex **3-part FlexFX** has profiles that move smoothly between four points.

For example:
```block
flexFX.create3PartFlexFX("Wail", 50, 50,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 200, 100,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 100, 100,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 150, 50, 33, 33,
    400, 200, 800);
```

## Creating a Double FlexFX #flexFX-createDoubleFlexFX
For some special sounds (e.g a two-tone police siren) we need a silent gap separating two simple sound-expressions.

This is called a **double FlexFX**. Each part has play-settings for its start-point and end-point, 
and the duration percentages will controls the lengths of the first sound, and of the silence in-between.

For example:
```block
	flexFX.createDoubleFlexFX("Siren", 95, 80,
		Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 100, 100,
		70, 100,
		Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 75, 80, 45, 10,
        800, 200, 1000);
```

## Changing a FlexFX
Any FlexFX can be freely modified using any of the ``||FlexFX:create...||`` blocks, by specifying its name (its **id**). 

The basic rule is that if it exists, it gets changed; otherwise it is created from scratch.


-----------------------------------------------------------------------
-----------------------------------------------------------------------
# Acknowledgements 
Credit must go to Bill Siever (on the Micro:bit Developer Slack Forum) for his experienced insights into the workings 
of the Micro:bit run-time, and his unstinting assistance in navigating the complex process of publishing an Extension.
Credit must also go to Martin Williams (of the Micro:bit Educational Foundation) for his meticulous appraisals 
and generous inputs that have been invaluable in developoing and evolving the FlexFX design.


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
