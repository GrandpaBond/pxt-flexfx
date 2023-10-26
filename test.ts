// *********** test codes **********

// perform a built-in FlexFX with all the defaults
flexFX.playBuiltInFlexFX(flexFX.BuiltInFlexFX.Whale, true);

// perform the simple built-in chime flexFX
flexFX.playFlexFX("ting", 7, 180, 400, true); // up a fifth
flexFX.playFlexFX("ting", 4, 180, 400, true); // up a major 3rd
flexFX.playFlexFX("ting", 0, 250, 1600, true);

pause(1000);


// perform like a cat
flexFX.playFlexFX("miaow", 900, 255, 1000, true);
pause(300);
flexFX.playFlexFX("miaow", 1100, 255, 500, true);
pause(300);
flexFX.playFlexFX("miaow", 800, 255, 1500, true);

pause(1000);


// perform "New World" theme on the 2-part horn flexFX
flexFX.playFlexFX("horn", Note.E3 - Note.C3, 255, 900, true);
flexFX.playFlexFX("horn", Note.G3 - Note.C3, 255, 300, true);
flexFX.playFlexFX("horn", Note.G3 - Note.C3, 255, 1200, true);
flexFX.playFlexFX("horn", Note.E3 - Note.C3, 255, 900, true);
flexFX.playFlexFX("horn", Note.D3 - Note.C3, 255, 300, true);
flexFX.playFlexFX("horn", Note.C3 - Note.C3, 255, 1200, true);
flexFX.playFlexFX("horn", Note.D3 - Note.C3, 255, 600, true);
flexFX.playFlexFX("horn", Note.E3 - Note.C3, 255, 600, true);
flexFX.playFlexFX("horn", Note.G3 - Note.C3, 255, 600, true);
flexFX.playFlexFX("horn", Note.E3 - Note.C3, 255, 600, true);
flexFX.playFlexFX("horn", Note.D3 - Note.C3, 255, 2400, true);

pause(1000);

// create a flexFX for a two-tone police-siren (middle part is silent)
flexFX.defineFlexFX("police", flexFX.Wave.Sawtooth, 760, 800, 160, 200, 450,
    flexFX.Effect.None, flexFX.Attack.Even);
// (add a silent gap in the middle)
flexFX.extendFlexFX("police", flexFX.Wave.Silence, 0, 0, 100,
    flexFX.Effect.None, flexFX.Attack.Even);
flexFX.extendFlexFX("police", flexFX.Wave.Sawtooth, 600, 160, 450,
    flexFX.Effect.None, flexFX.Attack.Even);

// queue-up a sequence of Plays on the Play-list (complete with Doppler-shift)
flexFX.playFlexFX("police", 800, 16, 1000, false);
flexFX.playFlexFX("police", 800, 32, 1000, false);
flexFX.playFlexFX("police", 800, 64, 1000, false);
flexFX.playFlexFX("police", 800, 128, 1000, false);
flexFX.playFlexFX("police", 800, 255, 1000, false);
flexFX.playFlexFX("police", 775, 255, 1000, false);
flexFX.playFlexFX("police", 750, 128, 1000, false);
flexFX.playFlexFX("police", 750, 64, 1000, false);
flexFX.playFlexFX("police", 750, 32, 1000, false);
flexFX.playFlexFX("police", 750, 16, 1000, false);

// while the Play-list is playing, flash the blue light (sort of)
while(flexFX.isActive()) {
    basic.showIcon(IconNames.SmallDiamond);
    basic.showIcon(IconNames.Diamond);
}

pause(1000);

// queue-up a sequence of Plays on the Play-list (J.S.Bach)
flexFX.playFlexFX("violin", Note.E5 - Note.C3, 250, 300, true);
flexFX.playFlexFX("violin", Note.A5 - Note.C3, 250, 900, true);
flexFX.playFlexFX("violin", Note.E5 - Note.C3, 250, 300, true);
flexFX.playFlexFX("violin", Note.F5 - Note.C3, 250, 900, true);
flexFX.playFlexFX("violin", Note.D5 - Note.C3, 250, 300, true);
flexFX.playFlexFX("violin", Note.E5 - Note.C3, 250, 150, true);
flexFX.playFlexFX("violin", Note.D5 - Note.C3, 250, 150, true);
flexFX.playFlexFX("violin", Note.C5 - Note.C3, 250, 150, true);
flexFX.playFlexFX("violin", Note.E5 - Note.C3, 250, 150, true);
flexFX.playFlexFX("violin", Note.D5 - Note.C3, 250, 150, true);
flexFX.playFlexFX("violin", Note.C5 - Note.C3, 250, 150, true);
flexFX.playFlexFX("violin", Note.B4 - Note.C3, 250, 150, true);
flexFX.playFlexFX("violin", Note.D5 - Note.C3, 250, 150, true);
flexFX.playFlexFX("violin", Note.C5 - Note.C3, 250, 300, true);
flexFX.playFlexFX("violin", Note.A4 - Note.C3, 250, 900, true);

 // while the Play-list is playing, jiggle a note around
while (flexFX.isActive()) { 
    images.iconImage(IconNames.QuarterNote).showImage(-2, 150);
    images.iconImage(IconNames.QuarterNote).showImage(-1, 150);
    images.iconImage(IconNames.QuarterNote).showImage(0, 150);
    images.iconImage(IconNames.QuarterNote).showImage(-1, 150);
}

basic.showIcon(IconNames.Target);
pause(1000);
 

// queue up some Plays on the Play-list, with pauses queued in-between
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

pause(2000)
// now re-build the Play-list of 5 cries
basic.showIcon(IconNames.Sad);
flexFX.stopPlaying();  // inhibit Playing
flexFX.playFlexFX("cry", 200, 250, 1000, true);
flexFX.playFlexFX("cry", 300, 250, 1000, true);
flexFX.playFlexFX("cry", 400, 250, 1000, true);
flexFX.playFlexFX("cry", 600, 250, 1000, true);
flexFX.playFlexFX("cry", 800, 250, 1000, true);
basic.showNumber(flexFX.waitingToPlay());

pause(1000)
// synchronise a different way, by playing queued Plays one-at-a-time, 
// with explicit pauses...
let delay = 1600;
while (flexFX.waitingToPlay() > 0) {
    flexFX.startPlaying(); // allow the next Play to happen
    pause(20);
    // as soon as the first Play begins, prevent any more being started
    flexFX.stopPlaying();
    basic.showIcon(IconNames.Surprised);  // open the mouth...
    flexFX.awaitPlayFinish();
    basic.showIcon(IconNames.Sad); // close the mouth again
    pause(delay); 
    delay -= 200; // decrease the silence in-between 
}

pause(500);
basic.showIcon(IconNames.Happy);
pause(2000)

// finally: check we can delete an unwanted Play-list of 5 tweets
flexFX.stopPlaying();  // inhibit Playing
flexFX.playFlexFX("tweet", 200, 250, 1000, true);
flexFX.playFlexFX("tweet", 300, 250, 1000, true);
flexFX.playFlexFX("tweet", 400, 250, 1000, true);
flexFX.playFlexFX("tweet", 600, 250, 1000, true);
flexFX.playFlexFX("tweet", 800, 250, 1000, true);
basic.showNumber(flexFX.waitingToPlay());
pause(1000);
basic.showIcon(IconNames.No);
pause(1000);
flexFX.deletePlaylist();
basic.showNumber(flexFX.waitingToPlay());
pause(2000)


