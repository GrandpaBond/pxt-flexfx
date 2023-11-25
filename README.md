```package
pxt-flexfx=github:grandpabond/pxt-flexfx
```

# FlexFX - Flexible Sound-effect Recipes
Many microbit projects can be brought to life by adding sound-effects to indicate their state.

The ``|music:Music|`` category has a ``||music:micro:bit(V2)||`` section with blocks for **sound-expressions**. 
These let you build some amazing sounds, but sometimes you need something a bit more complex.

A ``||flexFx:flexFX||`` provides a "sound journey", following a sonic path through time that flows smoothly through two or more fixed points in both pitch & volume. To achieve  this, it can stitch together multiple consecutive sound-expressions to give a smoothly varying result. 

As its name suggests, once defined, a ``||flexFX:flexFX||`` recipe can be re-used flexibly for different performances
(or **Plays**) that independently scale these pitch & volume profiles and stretch or shrink their duration. 
You can choose which ``||flexFX:flexFX||`` to play from a drop-down list of built-in sounds.

Any ``||flexFX:flexFX||`` can also be used as the "instrument" on which to play a short melody.
You can choose from a small selection of built-in **Tunes**: playing one automatically creates a sequence of individually tuned
Plays, one for each of its notes.

You can also compose your own Tunes, using a simple text notation. (See ``||flexFX:Composing Tunes||`` below)

When playing an individual ``||flexFX:flexFX||`` or a Tune, you can either wait for it to finish, 
or you can let it continue playing in the background while executing other code. If it hasn't already
finished when you play another one, the new Play(s) will be added to the **Play-list**, 
so you can queue-up several sounds to happen in the background. You can interact with this 
Play-list to synchronise the sound-track with your other codes. (See ``||flexFX:Background Play-list||`` below).

If you need a sound that is not built-in, you can even design your own. (See ``||flexFX:Designing a FlexFX||`` below)

## Playing a FlexFX #flexFX-playFlexFX 

 ```sig 
 flexFX.playFlexFX(id, wait, pitch, volumeLimit, newDuration) { 
 ```
This lets you play a ``||flexFX:flexFX||``, optionally changing some of its characteristics. 
  
> ``||flexFX:id||`` says which one to play.
  
> ``||flexFX:wait||`` is a switch. If **"true"**, the sound is played to completion. If **"false"**,
it is added to the Play-list, to be played in the background. (If the Play-list is empty, 
it will start playing immediately.) 
 
By repeatedly clicking on the "+" you can access three additional parameters to change the pitch, 
volume or duration of this Play.

> ``||flexFX:pitch||``  lets you specify a different **base-frequency** for this performance, measured in Hertz. 
(The base-frequency is the average pitch across the whole sound). If you use the ``||Middle C||`` reporter block from 
the ``||music: Music||`` category to change the base-frequency, you can then click on it to select a note from the 
pop-up piano keyboard.

  
> ``||flexFX:volumeLimit||`` sets the peak volume as a number in the range 0-255. 
  
> ``||flexFX:newDuration||`` sets how long (in milliseconds) the overall performance will last. 
  
The following example would play the built-in FlexFX called **"chime"** three times over, with descending pitch, 
and increasing volume. The first two performances last just 0.4 seconds each, while the final performance 
takes 1.6 seconds to complete. 
  
 ```blocks 
 flexFX.playFlexFX("chime", true, Note.G4, 100, 400); 
 flexFX.playFlexFX("chime", true, Note.E4, 175, 400); 
 flexFX.playFlexFX("chime", true, Note.C4, 250, 1600); 
 ``` 
### ~reminder
When coding in Javascript, for convenience you can set the new pitch using the ``||music:noteFrequency()||`` function,
or any of the various musical note constants such as ``||music: Music.C5||``. 
### ~

## Selecting a FlexFX #flexFX-builtInFlexFX 

```sig
flexFX.builtInFlexFX(flex): string 
```

Every ``||flexFX:flexFX||`` has a unique name: its identifier. This reporter block (which may be used as the first 
parameter of the ``||flexFX:playFlexFX||`` block above) provides a drop-down list from which you can choose 
a built-in ``||flexFX:flexFX||`` to hear.
 
# Tunes
Since a ``||flexFX:FlexFX||`` can vary its pitch and duration, you can easily use it to play a Tune.
There are blocks that allow you to perform built-in Tunes and also compose your own new ones 


## Playing a Tune #flexFX-playTune

```sig
flexFX.playTune(title, flexId, wait, transpose, volumeLimit, tuneDuration)
```

> ``||flexFX:title||`` is the name of the Tune to be played.
 
> ``||flexFX:flexId||`` is the name of the``||flexFX:FlexFX||`` to be used to play it.

> ``||flexFX:wait||`` is a switch. If **"true"**, the Tune is played to completion. If **"false"**,  
 its sequence of notes all get added to the Play-list to be played in the background. 
 (If the Play-list is currently empty, the Tune will start playing immediately.) 
 
By repeatedly clicking on the "+" you can access three additional parameters to change the pitch, volume or duration
of this performance of the Tune. 
  
> ``||flexFX:transpose||`` specifies a number of semitone steps by which to raise (or, if negative, lower) all notes in the flexFX:Tune.
  
> ``||flexFX:volumeLimit||`` sets the peak volume for every note played, as a number in the range 0-255. 
  
> ``||flexFX:tuneDuration||`` changes how long (in milliseconds) the overall performance will last. If left at 0, the Tune will be
played at the default speed of 120 beats-per-minute (or as specified by ``||flexFX:setNextTempo()||``)

The following example uses the built-in whalesong to celebrate your birthday (but rather slowly):
```blocks
flexFX.playTune("birthday", "whale", true, -7, 250, 30000);
```

## Selecting a Tune #flexFX-builtInTune 

```sig
flexFX.builtInTune(tune): string 
```
This reporter block (which may be used as the first parameter of the ``||flexFX:playTune||`` block above) 
provides a drop-down list from which you can choose a built-in Tune to play.

## Setting the Tempo #flexFX-setNextTempo

```sig
flexFX.setNextTempo(bpm)
```
This block adjusts the speed at which Tunes are played.

> ``||flexFX:bpm||`` adjusts the beats-per-minute (BPM) for playTune() to use.

The length of each note in a Tune (its **Extent**) is actually measured in quarter-beat **Ticks**. 
The current length of a Tick controls how fast ``||flexFX:playTune||`` plays the Tune 
(unless its optional ``||flexFX:tuneDuration||`` parameter says otherwise). 

The initial default speed of 120 beats-per-minute (BPM) means that the default Tick lasts 125 ms. 
At this default tempo, the following table shows how the ``||flexFX:Extent||`` relates to conventional musical note-lengths: 

| Extent | length          |ms    |per-Sec|per-Min| 
| ---:   | :-------------- | ---: | ----: | ----: | 
|   1    | semi-quaver     |  125 |  8.00 |   480 | 
|   2    | quaver          |  250 |  4.00 |   240 | 
|   4    | crotchet(1 beat)|  500 |  2.00 |   120 | 
|   6    | dotted-crotchet |  750 |  1.33 |    80 | 
|   8    | minim           | 1000 |  1.00 |    60 | 
|  12    | dotted-minim    | 1500 |  0.67 |    40 | 
|  16    | semibreve       | 2000 |  0.50 |    30 | 

You can change the default speed using ``||flexFX:setNextTempo()||``. 
 
## Composing Tunes

### EKO-notation 
FlexFX Tunes are written out as text-strings using a special code that we call **EKO-notation** (pronounced "echo"). 
Notes are defined by three-part EKO codes, separated by spaces. 

> ``||flexFX:Extent||``: The first part of the code is a number showing how long the note should last (measured in quarter-beat ticks). 

> ``||flexFX:Key||``: This is followed by the key-letter [CDEFGAB]. For the black keys (on a piano) you add "#" (sharp) to the key below, or "b" (flat) to the key above. 

> ``||flexFX:Octave||``: The last part of the code gives the octave-number [1‐9], where C4 is middle-C. 


So, the first line of "Happy Birthday" might be scored as  "4G4 2G4 6A4 6G4 6C5 12B4". 

### Musical Rests

In EKO-notation, musical rests are coded using an Extent followed by just the letter "R" (with no Octave).

So, the start of Beethoven's Fifth Symphony might be scored as "2R 2G4 2G4 2G4 8Eb4 2R 2F4 2F4 2F4 8D4".


### ~reminder 
In the past, melodies have often been written down as text using **ABC-notation**. That scheme lists the notes to be played quite simply, 
but involves many complex rhythmic and octave-selection conventions that require a fair degree of study and musical expertise to master.
Although not as compact, our EKO-notation is far more logical and straightforward, and is much easier for beginners to use. 
### ~

## Composing a new Tune #flexFX-composeTune 

```sig 
flexFX.composeTune(title, score)
```
This block lets you start composing a new Tune, using EKO-notation (Extent-Key-Octave).

> ``||flexFX:title||`` is the song-title. (Any existing Tune with the same "title" is first deleted.)

> ``||flexFX:score||`` is simply a list of the notes in the melody, defined as EKO codes.

This example adds the Tune "Edelweiss", defining the notes in its first line:

```blocks
flexFX.composeTune("edelweiss", "4E4 2G4 6D5 4C5 2G4 4F4 2R");
```

## Extending a Tune #flexFX-extendTune 

```sig 
flexFX.extendTune(title, score) 
``` 

For all but the shortest melody, the score would get unmanageably long (and confusing) to specify on just a single call.
By following ``||flexFX:composeTune||`` with one or more calls to ``||flexFX:extendTune||``, you can write it out more conveniently,
one line at a time.	

> ``||flexFX:title||`` identifies the song to be added-to.  

> ``||flexFX:score||`` is the list of the notes, defined as EKO codes, to be added to the end of the Tune.

This example extends the Tune "edelweiss" by adding the next three lines:

```blocks
flexFX.extendTune("edelweiss", "4E4 2E4 2E4 2F4 2G4 6A4 4G4 2R");
flexFX.extendTune("edelweiss", "4E4 2G4 6D5 4C5 2G4 4F4 2R");
flexFX.extendTune("edelweiss", "4E4 2G4 2G4 2A4 2B4 6C5 4C5 2R");
```

### ~reminder
By specifying its title, any Tune can be freely modified using  ``||flexFX:composeTune||``, or ``||flexFX:extendTune||``.
The basic rule is that if it exists, it gets changed; otherwise it is created from scratch. Obviously, each Tune 
you create will take up memory: the longer the tune, the more memory required to hold it. If you get too creative, there will come 
a point at which memory runs out! 
### ~


# Background Play-list 
Often, a sound-effect or melody is intended to accompany other actions that require codes to be executed. 
  
By switching the **wait** parameter of ``||flexFX:playFlexFX||`` or ``||flexFX:playTune||`` to **false**, the function will return 
immediately, and queue-up the ``||flexFX:FlexFX||`` performance(s) (which we call **Plays**) so that they happen in the background.  
  
You can queue-up many different Plays on the internal **Play-list**, and the background process will just work steadily through them, 
one-at-a-time, allowing your code to get on with something else.

### ~reminder
Obviously, the queue of Plays take up memory: if the Play-list is allowed to get too long there will eventually come a point at
which this runs out! 
### ~

Sometimes you might want tighter control over exactly when each queued Play occurs, so various advanced blocks are provided 
(under ``||flexFX:... more||``) that let you interact with the Play-list. 
  
## Spacing-out background Plays  #flexFX-playSilence                 
```sig 
flexFX.playSilence(ms) 
``` 
  
When queueing-up a series of Plays, you may not always want them to follow-on straightaway. Use this function to space-out your Plays, by adding a silent pause onto the Play-list. 
 
> ``||flexFX:ms||`` : specifies the length of the gap in milliseconds.
   
This example plays three bell-sounds in the background, separated by gaps of 1.5 seconds: 

```blocks
   flexFX.playFlexFX("ting", true, Note.G5, 100, 400); 
   flexFX.playSilence(1500); 
   flexFX.playFlexFX("ting", true, Note.E5, 175, 400); 
   flexFX.playSilence(1500); 
   flexFX.playFlexFX("ting", true, Note.C5, 250, 1600); 
``` 
  
## Waiting for the Play-list... 
If your codes need to synchronise other activites (such as servo-actions or display-changes) precisely 
to the performance of a queued sequence of sound-effects, you can use one of these **wait** blocks: 
  
## Waiting for the next Play to start  #flexFX-awaitPlayStart 
 ```sig 
flexFX.awaitPlayStart()   
 ``` 
Awaits start of the next FlexFX performance on the Play-list. (Returns immediately if there are none.) 
  
## Waiting for the current Play to finish  #flexFX-awaitPlayFinish 
 ```sig 
flexFX.awaitPlayFinish()  
 ``` 
Awaits completion of the FlexFX performance currently playing. (Returns immediately if there are none.) 
  
## Waiting for the whole Play-list to finish  #flexFX-awaitAllFinished 
 ```sig 
flexFX.awaitAllFinished()   
 ``` 
Awaits completion of everything on the Play-list.  (Returns immediately if there are none.) 
  
## Pausing play-back of the Play-list  #flexFX-stopPlaying 
 ```sig 
flexFX.stopPlaying()  
 ``` 
You can also pause (and later re-start) the background Play-list. This block suspends future background playing from the Play-list 
(once any currently active Play has finished). 
  
## Playing the rest of the Play-list  #flexFX-startPlaying 
 ```sig 
flexFX.startPlaying()  
 ``` 
This unlocks the Play-list, resuming background playing of any queued (or future) Plays.   
  
## Checking how many Plays remain on the Play-list  #flexFX-waitingToPlay 
 ```sig 
flexFX.waitingToPlay(): number  
 ``` 
Sometimes it may be important for your codes to know how far the Play-list has got. 
This reporter block returns the current length of the (unplayed) Play-list. 
  
## Abandoning a Play-list you don't need any more  #flexFX-deletePlaylist 
```sig  
flexFX.deletePlaylist()   
``` 
Deletes from the Play-list everything left unplayed. 


## Play-list Example:  Lip-sync
So for example, this code snippet would choreograph a crying face, alternating the two icons to achieve lip-sync.  

The code queues up some Plays of the built-in FlexFX "cry" on the Play-list,  
with different pauses queued in-between. Note that by calling ``||flexFX:stopPlaying||`` first,  
we prevent the first Plays happening until we are ready to call ``||flexFX:startPlaying||``.  
Within the loop, we use ``||flexFX:awaitPlayStart||`` and ``||flexFX:awaitPlayFinish||`` to synchronise the mouth-changes. 

```blocks
// first queue up some Plays on the Play-list, with pauses queued in-between 
flexFX.stopPlaying();  // don't start Playing yet... 
flexFX.playFlexFX("cry", true, 200, 250, 1000); 
flexFX.playSilence(2000); 
flexFX.playFlexFX("cry", true, 300, 250, 1000); 
flexFX.playSilence(1500); 
flexFX.playFlexFX("cry", true, 400, 250, 1000); 
flexFX.playSilence(1000); 
flexFX.playFlexFX("cry", true, 600, 250, 1000); 
flexFX.playSilence(800); 
flexFX.playFlexFX("cry", true, 800, 250, 1000); 
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

# Designing a FlexFX 
There are lots of ``||flexFX:flexFX||`` sounds already built-in, but if you wanted something different 
there are some advanced blocks (under ``||flexFX:... more||``) that will let you build your own from scratch. 

## Anatomy of a FlexFX 
The basic idea is that a FlexFX is built from one or more **parts**. 

Each part is a sound-expression that takes a particular **style** of sound and varies its **[pitch,volume]** 
parameters from a start-point to an end-point, over some period of time. Successive parts inherit the previous end-point as their own start-point.

Note that each part can use a different style of sound, specified by its own **wave-shape** and **attack**, plus a possible **effect**. 

### Style: Wave-shape 
The wave-shape sets the basic tonal quality: the spikier the wave, the harsher the sound. There are six shapes available: 

> ``||flexFX:Pure||`` selects a Sine-wave, a smooth, clean shape giving a smooth, clean tone. 

> ``||flexFX:Buzzy||`` selects a Square-wave containing harmonics, partial tones that are multiples (in this case 3,5,7...) of the main frequency. 
This gives a square wave a richer and buzzier sound. 

> ``||flexFX:Bright||`` selects a Triangular-wave containing the same odd harmonics as a square wave, but with the higher ones tapering off. 
It sounds clear and bright. 

> ``||flexFX:Harsh||`` selects a Sawtooth-wave which is the richest in terms of harmonics, making it sound even harsher than a square wave, 

> ``||flexFX:Noisy||`` selects a randomised wave-shape that takes harshness to the extreme: it doesn't have any real pitch left at all! 

> ``||flexFX:Silence||`` is an option that allows you to put silent gaps into your sound, while specifying the start-point for the next part. 

### Style: Attack 
The attack chooses how fast the pitch moves from the start-point to the end-point of the FlexFX part. 

> ``||flexFX:Fast||`` gives an extreme percussive attack, moving very rapidly away from the start-point towards the end-point.  

> ``||flexFX:Medium||`` follows a curved path, changing more quickly to start with, then gradually slowing down. 

> ``||flexFX:Slow||`` selects a simple straight-line path, changing evenly over time. 


### ~reminder
Note that the Attack can only apply to pitch changes: the internal soundEffects synthesiser only ever changes the volume linearly from start-point 
to end-point. So percussive, bell-like sounds (where an initial rapid fall in volume is followed by a slower decay) will require two or more parts.
### ~

### Style: Effect 
There are three special-effects that can optionally be added. 

> ``||flexFX:Vibrato||`` wobbles the pitch up and down as it progresses. 

> ``||flexFX:Tremolo||`` flutters the volume throughout. 

> ``||flexFX:Warble||`` is a rather more extreme version of Vibrato. 

> ``||flexFX:None||`` skips any of these effects. 

There is currently no control of how rapidly or deeply these effects are applied. (This functionality would be a welcome upgrade
to the core soundEffect synthesis system). 


## Creating a new FlexFX #flexFX-createFlexFX 

```sig 
flexFX.createFlexFX() 
``` 

This complex block is used to specify the first (or only) part of a new ``||flexFX:FlexFX||``. (When first created, it has just the one part 
so is really just a tuneable version of a standard soundExpression).
   

> ``||flexFX:id||`` - the identifier of the flexFX to be created or changed. (Any existing FlexFX with the same "id" is first deleted.)

> ``||flexFX:startPitch||`` - the initial frequency of the sound (in Hz)

> ``||flexFX:startVolume||`` - the initial volume of the sound (0 to 255)

> ``||flexFX:wave||`` - chooses the wave-form that characterises this sound

> ``||flexFX:attack||`` - chooses how fast the sound moves from its initial to final pitch

> ``||flexFX:effect||`` - chooses a possible modification to the sound, such as vibrato

> ``||flexFX:endPitch||`` - the final frequency of the sound (in Hz)

> ``||flexFX:endVolume||`` - the final volume of the sound (0 to 255)

> ``||flexFX:duration||`` - the duration of the sound (in ms)   



## Extending a FlexFX #flexFX-extendFlexFX 
Every call to  ``||flexFX:extendFlexFX||`` adds another part to your ``||flexFX:FlexFX||``, continuing on from its current final frequency and volume.

> ``||flexFX:id||``  - the identifier of the flexFX to be extended

> ``||flexFX:wave||``  - chooses the wave-form that characterises this next part

> ``||flexFX:attack||``  - chooses how fast this part moves from its initial to final pitch

> ``||flexFX:effect||``  - chooses a possible modification to this part, such as vibrato

> ``||flexFX:endPitch||``  - the new final frequency of the FlexFX (in Hz)

> ``||flexFX:endVolume||``  - the new final volume of the FlexFX (0 to 255)

> ``||flexFX:duration||``  - the additional duration of this new part (in ms)


### ~reminder
By specifying it by name (its **id**), any ``||flexFX:FlexFX||`` can be freely modified using  ``||flexFX:createFlexFX||`` 
or ``||flexFX:extendFlexFX||``. The basic rule is that if it exists, it gets changed; otherwise it is created from scratch. 
Obviously, each ``||flexFX:FlexFX||`` you create will take up memory:  if you create too many, there will come a point 
at which memory runs out! 
### ~


# Examples 

## Create a Tom-Tom FlexFX.
This example creates a new ``||flexFX:FlexFX||`` sounding a bit like a Tom-Tom.

```blocks
flexFX.defineFlexFX("tomtom", 669, 255, flexFX.Wave.Triangle,
            flexFX.Attack.Fast, flexFX.Effect.Vibrato, 500, 100, 100);
flexFX.extendFlexFX("tomtom", flexFX.Wave.Triangle,
            flexFX.Attack.Even, flexFX.Effect.None, 500, 30, 500);
flexFX.extendFlexFX("tomtom", flexFX.Wave.Triangle, 
            flexFX.Attack.Even, flexFX.Effect.None, 200, 20, 200);
```

It starts with a short (100ms) percussion sound that dips slightly in pitch, and dies away quickly.
This is followed by a longer (half-second) resonant vibration, getting slightly quieter.
In the final 200ms, the pitch falls away strongly.


## Create an Owl call.
This more complex example creates a new ``||flexFX:FlexFX||`` giving the familiar "Tu-Whit, Tu-Whooo" call of the Tawny Owl.

```blocks

```

This six-part simulation starts with a falling "Tu" followed by a rising "-Whit".
There is then a silent gap before the second section.
This repeats the falling "Tu" part, followed by a long rise and an even longer falling tone,
creating the final "-Whooo" of the call.

-----------------------------------------------------------------------
-----------------------------------------------------------------------
# Acknowledgements 
Credit must go to Martin Williams (of the Micro:bit Educational Foundation) for his meticulous appraisals 
and generous inputs that have been invaluable in developing and evolving the FlexFX design.


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
