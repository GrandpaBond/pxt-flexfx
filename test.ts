// *********** test codes **********
/***
 ***/
// perform a built-in FlexFX with all the defaults
basic.showIcon(IconNames.Target); 
flexFX.playFlexFX("uhoh");
basic.showIcon(IconNames.Yes);
pause(2000);

// perform the simple built-in chime flexFX
basic.showIcon(IconNames.Target);
flexFX.playFlexFX("ting", true, Note.G5, 180, 400); // up a fifth
flexFX.playFlexFX("ting", true, Note.E5, 180, 400); // up a major 3rd
flexFX.playFlexFX("ting", true, Note.C5, 250, 1600);

basic.showIcon(IconNames.Yes);
pause(2000);

// perform like a cat
basic.showIcon(IconNames.Target);
flexFX.playFlexFX("miaow", true, 900, 255, 1000);
pause(800);
flexFX.playFlexFX("miaow", true, 1100, 255, 500);
pause(300);
flexFX.playFlexFX("miaow", true, 800, 255, 1500);

basic.showIcon(IconNames.Yes);
pause(2000);

// perform "New World" theme as individual performances
basic.showIcon(IconNames.Target);
flexFX.playFlexFX("horn", true, Note.E3, 255, 900);
flexFX.playFlexFX("horn", true, Note.G3, 255, 300);
flexFX.playFlexFX("horn", true, Note.G3, 255, 1200);
flexFX.playFlexFX("horn", true, Note.E3, 255, 900);
flexFX.playFlexFX("horn", true, Note.D3, 255, 300);
flexFX.playFlexFX("horn", true, Note.C3, 255, 1200);
flexFX.playFlexFX("horn", true, Note.D3, 255, 600);
flexFX.playFlexFX("horn", true, Note.E3, 255, 600);
flexFX.playFlexFX("horn", true, Note.G3, 255, 600);
flexFX.playFlexFX("horn", true, Note.E3, 255, 600);
flexFX.playFlexFX("horn", true, Note.D3, 255, 2400);

basic.showIcon(IconNames.Yes);
pause(2000);
// create a flexFX for a two-tone police-siren (middle part is silent)
basic.showIcon(IconNames.Target);
flexFX.defineFlexFX("police", 760, 160, flexFX.Wave.Sawtooth, flexFX.Attack.Delayed, flexFX.Effect.None, 800, 200, 450);
// (add a silent gap in the middle)
flexFX.extendFlexFX("police", flexFX.Wave.Silence, flexFX.Attack.Even, flexFX.Effect.None, 560, 200, 100);
flexFX.extendFlexFX("police", flexFX.Wave.Sawtooth, flexFX.Attack.Even, flexFX.Effect.None, 600, 160, 450);
// queue-up a sequence of Plays on the Play-list (complete with Doppler-shift)
flexFX.playFlexFX("police", false, 800, 16, 1000);
flexFX.playFlexFX("police", false, 800, 32, 1000);
flexFX.playFlexFX("police", false, 800, 64, 1000);
flexFX.playFlexFX("police", false, 800, 128, 1000);
flexFX.playFlexFX("police", false, 800, 255, 1000);
flexFX.playFlexFX("police", false, 775, 255, 1000);
flexFX.playFlexFX("police", false, 750, 128, 1000);
flexFX.playFlexFX("police", false, 750, 64, 1000);
flexFX.playFlexFX("police", false, 750, 32, 1000);
flexFX.playFlexFX("police", false, 750, 16, 1000);
flexFX.startPlaying(); // kick off the Play-list
// while the Play-list is playing, flash the blue light (sort of)
while (flexFX.isActive()) {
    basic.showIcon(IconNames.SmallDiamond);
    basic.showIcon(IconNames.Diamond);
}

basic.showIcon(IconNames.Yes);
pause(2000);

// queue-up a sequence of Plays on the Play-list (J.S.Bach)
basic.showIcon(IconNames.Target);
flexFX.stopPlaying();  // don't start Playing yet...
flexFX.playFlexFX("violin", false, Note.E5, 250, 300);
flexFX.playFlexFX("violin", false, Note.A5, 250, 900);
flexFX.playFlexFX("violin", false, Note.E5, 250, 300);
flexFX.playFlexFX("violin", false, Note.F5, 250, 900);
flexFX.playFlexFX("violin", false, Note.D5, 250, 300);
flexFX.playFlexFX("violin", false, Note.E5, 250, 150);
flexFX.playFlexFX("violin", false, Note.D5, 250, 150);
flexFX.playFlexFX("violin", false, Note.C5, 250, 150);
flexFX.playFlexFX("violin", false, Note.E5, 250, 150);
flexFX.playFlexFX("violin", false, Note.D5, 250, 150);
flexFX.playFlexFX("violin", false, Note.C5, 250, 150);
flexFX.playFlexFX("violin", false, Note.B4, 250, 150);
flexFX.playFlexFX("violin", false, Note.D5, 250, 150);
flexFX.playFlexFX("violin", false, Note.C5, 250, 300);
flexFX.playFlexFX("violin", false, Note.A4, 250, 900);
flexFX.startPlaying(); // kick off the Play-list
// while the Play-list is playing, jiggle a note around
while (flexFX.isActive()) {
    images.iconImage(IconNames.QuarterNote).showImage(-2, 150);
    images.iconImage(IconNames.QuarterNote).showImage(-1, 150);
    images.iconImage(IconNames.QuarterNote).showImage(0, 150);
    images.iconImage(IconNames.QuarterNote).showImage(-1, 150);
}

basic.showIcon(IconNames.Yes);
pause(2000);

// use events to choreograph faces to sounds
basic.showIcon(IconNames.Target);
// first queue up some Plays on the Play-list, with pauses queued in-between
flexFX.stopPlaying();  // don't start Playing yet...
flexFX.playFlexFX("shout", false, 200, 250, 1000);
flexFX.playSilence(2000);
flexFX.playFlexFX("shout", false, 300, 250, 1000);
flexFX.playSilence(1500);
flexFX.playFlexFX("shout", false, 400, 250, 1000);
flexFX.playSilence(1000);
flexFX.playFlexFX("shout", false, 600, 250, 1000);
flexFX.playSilence(800);
flexFX.playFlexFX("shout", false, 800, 250, 1000);
basic.showNumber(flexFX.waitingToPlay());
pause(500);
basic.showIcon(IconNames.Sad);
pause(1000)
flexFX.startPlaying(); // kick off the Play-list
while (flexFX.isActive()) {
    flexFX.awaitPlayStart(); // starting the next (non-silent) Play...
    basic.showIcon(IconNames.Surprised); // ... so open the mouth
    flexFX.awaitPlayFinish();
    basic.showIcon(IconNames.Sad); // close the mouth again
    // (the active Player now "Plays" the queued silence)
}

basic.showIcon(IconNames.Yes);
pause(2000);

// synchronise a different way, by playing queued Plays one-at-a-time with explicit pauses...
basic.showIcon(IconNames.Target);
// first re-build the Play-list of 5 cries
flexFX.stopPlaying();  // inhibit Playing
flexFX.playFlexFX("cry", false, 200, 250, 1000);
flexFX.playFlexFX("cry", false, 300, 250, 1000);
flexFX.playFlexFX("cry", false, 400, 250, 1000);
flexFX.playFlexFX("cry", false, 600, 250, 1000);
flexFX.playFlexFX("cry", false, 800, 250, 1000);
basic.showNumber(flexFX.waitingToPlay());
pause(1000)
basic.showIcon(IconNames.Sad);
let delay = 3000;
while (flexFX.waitingToPlay() > 0) {
    flexFX.startPlaying(); // allow the next Play to happen
    pause(20);
    // as soon as the first Play begins, prevent any more being started
    flexFX.stopPlaying();
    basic.showIcon(IconNames.Surprised);  // open the mouth...
    flexFX.awaitPlayFinish();
    basic.showIcon(IconNames.Sad); // close the mouth again
    pause(delay);
    delay -= 600; // decrease the silence in-between 
}
pause(500);

basic.showIcon(IconNames.Yes);
pause(2000);

// check we can delete an unwanted Play-list of 5 tweets
basic.showIcon(IconNames.Target);
flexFX.stopPlaying();  // inhibit Playing
flexFX.playFlexFX("tweet", false, 200, 250, 1000);
flexFX.playFlexFX("tweet", false, 300, 250, 1000);
flexFX.playFlexFX("tweet", false, 400, 250, 1000);
flexFX.playFlexFX("tweet", false, 600, 250, 1000);
flexFX.playFlexFX("tweet", false, 800, 250, 1000);
basic.showNumber(flexFX.waitingToPlay());
pause(1000);
basic.clearScreen();
basic.showString("del:");
flexFX.deletePlaylist();
basic.showNumber(flexFX.waitingToPlay());
pause(3000);

basic.showIcon(IconNames.Yes);
pause(2000);

// check playing of tunes
basic.showIcon(IconNames.Target);
flexFX.playTune("birthday", "tweet");

basic.showIcon(IconNames.Yes);
pause(2000);
 
// check asynchrony of tunes
basic.showIcon(IconNames.Target);
flexFX.playTune("birthday", "hum", false, 200, 12000, -5);
basic.showNumber(flexFX.waitingToPlay());
pause(1000);
flexFX.startPlaying();
while (flexFX.isActive()) {
    images.iconImage(IconNames.StickFigure).showImage(-1, 150);
    pause(200);
    images.iconImage(IconNames.StickFigure).showImage(0, 150);
    pause(200);
    images.iconImage(IconNames.StickFigure).showImage(1, 150);
    pause(200);
    images.iconImage(IconNames.StickFigure).showImage(0, 150);
    pause(200);
}

basic.showIcon(IconNames.Yes);
pause(2000);

// check volume/duration overrides
basic.showIcon(IconNames.Target);
flexFX.playTune("newWorld", "horn",true,100,10000);

basic.showIcon(IconNames.Yes);
pause(2000);

// compose a brand new tune comprising 54 notes
basic.showIcon(IconNames.Target);
flexFX.composeTune("edelweiss", "4E4 2G4 6D5 4C5 2G4 6F4");
flexFX.extendTune("edelweiss", "4E4 2E4 2E4 2F4 2G4 6A4 6G4");
flexFX.extendTune("edelweiss", "4E4 2G4 6D5 4C5 2G4 6F4");
flexFX.extendTune("edelweiss", "4E4 2G4 2G4 2A4 2B4 6C5 6C5");
flexFX.extendTune("edelweiss", "3D5 1G4 2G4 3B4 1A4 2G4 4E4 2G4 6C5");
flexFX.extendTune("edelweiss", "4A4 2C5 4D5 2C5 6B4 6G4");
flexFX.extendTune("edelweiss", "4E4 2G4 6D5 4C5 2G#4 6F5");
flexFX.extendTune("edelweiss", "4E5 2G4 2G4 2A4 2B4 6C5 6C5");

// Play it, on the chime, asynchronously, softly,
//    lasting a full minute, transposed down by a fifth.
flexFX.playTune("edelweiss", "chime", false, 150, 60000, -7);
basic.clearScreen();
basic.showNumber(flexFX.waitingToPlay());
pause(1000);
flexFX.startPlaying();
// while the Play-list is playing, keep rotating a snowflake!
while (flexFX.isActive()) {
    basic.showLeds(`
        . . # . .
        # . # . #
        . # # # .
        # . # . #
        . . # . .
        `);
    basic.pause(30);
    basic.showLeds(`
        # . . # .
        . . # . .
        # # # # #
        . . # . .
        . # . . #
        `);
    basic.pause(30);
    basic.showLeds(`
        . # . # .
        . . # . .
        # # # # #
        . . # . .
        . # . # .
        `);
    basic.pause(30);
    basic.showLeds(`
        . . # . #
        # . # . .
        . # # # .
        . . # . #
        # . # . .
        `);
    basic.pause(30);
}
basic.showIcon(IconNames.Yes);
