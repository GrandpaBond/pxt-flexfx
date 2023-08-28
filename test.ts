// *********** test codes **********
// simple "ting" flexFX
flexFX.createFlexFX("", 100, 100, Wave.TRIANGLE, Attack.FAST, Effect.NONE, 100, 10,
    2000, 255, 200, BuiltInFlexFX.TING);
// perform the simple built-in chime flexFX
flexFX.playFlexFX("Ting", Note.G5, 250, 400, false);
flexFX.playFlexFX("Ting", Note.E5, 250, 400, false);
flexFX.playFlexFX("Ting", Note.C5, 250, 1600, false);

pause(1000);


// perform like a cat

flexFX.playFlexFX("Miaow", 900, 255, 1000, false);
pause(300);
flexFX.playFlexFX("Miaow", 1100, 255, 500, false);
pause(300);
flexFX.playFlexFX("Miaow", 800, 255, 1500, false);

pause(1000);


// perform "New World" theme on the 2-part Horn flexFX
flexFX.playFlexFX("Horn", Note.E3, 255, 900, false);
flexFX.playFlexFX("Horn", Note.G3, 255, 300, false);
flexFX.playFlexFX("Horn", Note.G3, 255, 1200, false);
flexFX.playFlexFX("Horn", Note.E3, 255, 900, false);
flexFX.playFlexFX("Horn", Note.D3, 255, 300, false);
flexFX.playFlexFX("Horn", Note.C3, 255, 1200, false);
flexFX.playFlexFX("Horn", Note.D3, 255, 600, false);
flexFX.playFlexFX("Horn", Note.E3, 255, 600, false);
flexFX.playFlexFX("Horn", Note.G3, 255, 600, false);
flexFX.playFlexFX("Horn", Note.E3, 255, 600, false);
flexFX.playFlexFX("Horn", Note.D3, 255, 2400, false);

pause(1000);

// create a double flexFX
flexFX.createDoubleFlexFX("Siren", 
        95, 80, Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 100, 100,
        70, 100, Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 75, 80, 45, 10,
        800, 200, 1000);

// queue-up a sequence of Plays on the Play-list (complete with Doppler-shift)
flexFX.playFlexFX("Siren", 800, 16, 1000, true);
flexFX.playFlexFX("Siren", 800, 32, 1000, true);
flexFX.playFlexFX("Siren", 800, 64, 1000, true);
flexFX.playFlexFX("Siren", 800, 128, 1000, true);
flexFX.playFlexFX("Siren", 800, 255, 1000, true);
flexFX.playFlexFX("Siren", 785, 255, 1000, true);
flexFX.playFlexFX("Siren", 770, 128, 1000, true);
flexFX.playFlexFX("Siren", 770, 64, 1000, true);
flexFX.playFlexFX("Siren", 770, 32, 1000, true);
flexFX.playFlexFX("Siren", 770, 16, 1000, true);

// while the Play-list is playing, flash the blue light (sort of)
while(flexFX.isActive()) {
    basic.showIcon(IconNames.SmallDiamond);
    basic.showIcon(IconNames.Diamond);
}

pause(1000);

// queue-up a sequence of Plays on the Play-list
flexFX.playFlexFX("Violin", Note.E5, 250, 300, true);
flexFX.playFlexFX("Violin", Note.A5, 250, 900, true);
flexFX.playFlexFX("Violin", Note.E5, 250, 300, true);
flexFX.playFlexFX("Violin", Note.F5, 250, 900, true);
flexFX.playFlexFX("Violin", Note.D5, 250, 300, true);
flexFX.playFlexFX("Violin", Note.E5, 250, 150, true);
flexFX.playFlexFX("Violin", Note.D5, 250, 150, true);
flexFX.playFlexFX("Violin", Note.C5, 250, 150, true);
flexFX.playFlexFX("Violin", Note.E5, 250, 150, true);
flexFX.playFlexFX("Violin", Note.D5, 250, 150, true);
flexFX.playFlexFX("Violin", Note.C5, 250, 150, true);
flexFX.playFlexFX("Violin", Note.B4, 250, 150, true);
flexFX.playFlexFX("Violin", Note.D5, 250, 150, true);
flexFX.playFlexFX("Violin", Note.C5, 250, 300, true);
flexFX.playFlexFX("Violin", Note.A4, 250, 900, true);

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
flexFX.playFlexFX("Wail", 200, 250, 1000, true);
flexFX.performSilence(2000);
flexFX.playFlexFX("Wail", 300, 250, 1000, true);
flexFX.performSilence(1500);
flexFX.playFlexFX("Wail", 400, 250, 1000, true);
flexFX.performSilence(1000);
flexFX.playFlexFX("Wail", 600, 250, 1000, true);
flexFX.performSilence(800);
flexFX.playFlexFX("Wail", 800, 250, 1000, true);
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
flexFX.playFlexFX("Wail", 200, 250, 1000, true);
flexFX.playFlexFX("Wail", 300, 250, 1000, true);
flexFX.playFlexFX("Wail", 400, 250, 1000, true);
flexFX.playFlexFX("Wail", 600, 250, 1000, true);
flexFX.playFlexFX("Wail", 800, 250, 1000, true);
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
