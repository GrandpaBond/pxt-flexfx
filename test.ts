// *********** test codes **********
// perform the simple built-in chime flexFX
flexFX.performFlexFX("Ting", Note.G5, 250, 400, false);
flexFX.performFlexFX("Ting", Note.E5, 250, 400, false);
flexFX.performFlexFX("Ting", Note.C5, 250, 1600, false);

pause(1000);

// create and perform a cat-like 2-part flexFX
flexFX.create2PartFlexFX("Miaow", 70, 50,
    Wave.SAWTOOTH, Attack.MEDIUM, Effect.NONE, 100, 100,
    Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 90, 80, 30);
flexFX.performFlexFX("Miaow", 900, 255, 1000, false);
pause(300);
flexFX.performFlexFX("Miaow", 1100, 255, 500, false);
pause(300);
flexFX.performFlexFX("Miaow", 800, 255, 1500, false);

pause(1000);

// create and perform a Horn 2-part flexFX
flexFX.create2PartFlexFX("Horn", 5, 50,
    Wave.SAWTOOTH, Attack.FAST, Effect.NONE, 100, 100,
    Wave.SINE, Attack.SLOW, Effect.NONE, 100, 80, 7);
flexFX.performFlexFX("Horn", Note.E3, 255, 900, false);
flexFX.performFlexFX("Horn", Note.G3, 255, 300, false);
flexFX.performFlexFX("Horn", Note.G3, 255, 1200, false);
flexFX.performFlexFX("Horn", Note.E3, 255, 900, false);
flexFX.performFlexFX("Horn", Note.D3, 255, 300, false);
flexFX.performFlexFX("Horn", Note.C3, 255, 1200, false);
flexFX.performFlexFX("Horn", Note.D3, 255, 600, false);
flexFX.performFlexFX("Horn", Note.E3, 255, 600, false);
flexFX.performFlexFX("Horn", Note.G3, 255, 600, false);
flexFX.performFlexFX("Horn", Note.E3, 255, 600, false);
flexFX.performFlexFX("Horn", Note.D3, 255, 2400, false);

pause(1000);

// create a double flexFX
flexFX.createDoubleFlexFX("NeeNaw", 
        95, 80, Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 100, 100,
        70, 100, Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 75, 80, 45, 10);

// queue-up a sequence of Plays on the Play-list (complete with Doppler-shift)
flexFX.performFlexFX("NeeNaw", 800, 16, 1000, true);
flexFX.performFlexFX("NeeNaw", 800, 32, 1000, true);
flexFX.performFlexFX("NeeNaw", 800, 64, 1000, true);
flexFX.performFlexFX("NeeNaw", 800, 128, 1000, true);
flexFX.performFlexFX("NeeNaw", 800, 255, 1000, true);
flexFX.performFlexFX("NeeNaw", 785, 255, 1000, true);
flexFX.performFlexFX("NeeNaw", 770, 128, 1000, true);
flexFX.performFlexFX("NeeNaw", 770, 64, 1000, true);
flexFX.performFlexFX("NeeNaw", 770, 32, 1000, true);
flexFX.performFlexFX("NeeNaw", 770, 16, 1000, true);

// while the Play-list is playing, flash the blue light (sort of)
while(flexFX.isActive()) {
    basic.showIcon(IconNames.SmallDiamond);
    basic.showIcon(IconNames.Diamond);
}

pause(1000);

// create and perform a Violin-like 3-part flexFX
flexFX.create3PartFlexFX("Violin", 1, 100,
    Wave.SAWTOOTH, Attack.FAST, Effect.NONE, 100, 75,
    Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 100, 75,
    Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 10, 100, 10, 85);

// queue-up a sequence of Plays on the Play-list
flexFX.performFlexFX("Violin", Note.E5, 250, 300, true);
flexFX.performFlexFX("Violin", Note.A5, 250, 900, true);
flexFX.performFlexFX("Violin", Note.E5, 250, 300, true);
flexFX.performFlexFX("Violin", Note.F5, 250, 900, true);
flexFX.performFlexFX("Violin", Note.D5, 250, 300, true);
flexFX.performFlexFX("Violin", Note.E5, 250, 150, true);
flexFX.performFlexFX("Violin", Note.D5, 250, 150, true);
flexFX.performFlexFX("Violin", Note.C5, 250, 150, true);
flexFX.performFlexFX("Violin", Note.E5, 250, 150, true);
flexFX.performFlexFX("Violin", Note.D5, 250, 150, true);
flexFX.performFlexFX("Violin", Note.C5, 250, 150, true);
flexFX.performFlexFX("Violin", Note.B4, 250, 150, true);
flexFX.performFlexFX("Violin", Note.D5, 250, 150, true);
flexFX.performFlexFX("Violin", Note.C5, 250, 300, true);
flexFX.performFlexFX("Violin", Note.A4, 250, 900, true);

 // while the Play-list is playing, jiggle a note around
while (flexFX.isActive()) { 
    images.iconImage(IconNames.QuarterNote).showImage(-2, 150);
    images.iconImage(IconNames.QuarterNote).showImage(-1, 150);
    images.iconImage(IconNames.QuarterNote).showImage(0, 150);
    images.iconImage(IconNames.QuarterNote).showImage(-1, 150);
}

basic.showIcon(IconNames.Target);
pause(1000);

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

pause(2000)
// now re-build the Play-list 
basic.showIcon(IconNames.Sad);
flexFX.stopPlaying();  // inhibit Playing
flexFX.performFlexFX("Wail", 200, 250, 1000, true);
flexFX.performFlexFX("Wail", 300, 250, 1000, true);
flexFX.performFlexFX("Wail", 400, 250, 1000, true);
flexFX.performFlexFX("Wail", 600, 250, 1000, true);
flexFX.performFlexFX("Wail", 800, 250, 1000, true);
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
    delay -= 200; // increase the silence in-between 
}

pause(500);
basic.showIcon(IconNames.Happy);
