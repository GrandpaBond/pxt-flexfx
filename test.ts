// *********** test codes **********

function doMood(mood: number) {
    switch (mood) {
        case 1: flexFX.hum();
            break;
        case 2: flexFX.grumble();
            break;
        case 3: flexFX.giggle();
            break;
        case 4: flexFX.whistle();
            break;
        case 5: flexFX.snore();
            break;
        case 6: flexFX.whimper();
            break;
        case 7: flexFX.cry();
            break;
        case 8: flexFX.shout();
            break;
    }
    basic.pause(1000)
}

function doSound(sound: number) {
    switch (sound) {
        case 1: flexFX.performFlexFX(MoodSound.TWEET.toString(), 800, 200, 400);
            break;
        case 2: flexFX.performFlexFX(MoodSound.LAUGH.toString(), 400, 200, 400);
            break;
        case 3: flexFX.performFlexFX(MoodSound.SNORE.toString(), 1, 200, 400);
            break;
        case 4: flexFX.performFlexFX(MoodSound.DOO.toString(), 500, 200, 300);
            break;
        case 5: flexFX.performFlexFX(MoodSound.QUERY.toString(), 400, 200, 700);
            break;
        case 6: flexFX.performFlexFX(MoodSound.UHOH.toString(), 350, 200, 650);
            break;
        case 7: flexFX.performFlexFX(MoodSound.MOAN.toString(), 500, 200, 700);
            break;
        case 8: flexFX.performFlexFX(MoodSound.DUH.toString(), 300, 200, 500);
            break;
        case 9: flexFX.performFlexFX(MoodSound.WAAH.toString(), 600, 200, 1100);
            break;
        case 10: flexFX.performFlexFX(MoodSound.GROWL.toString(), 250, 200, 700);
    }
    basic.pause(1000)
}
music.setBuiltInSpeakerEnabled(false);
// create and perform a simple flexFX
flexFX.createFlexFX("TEST-SIMPLE", 50, 50,
    Wave.SINE, Attack.SLOW, Effect.NONE, 100, 100);
flexFX.performFlexFX("TEST-SIMPLE", 800, 250, 1000)
pause(500);

// create and perform a 2-part flexFX
flexFX.create2PartFlexFX("TEST-2PART", 50, 50,
    Wave.TRIANGLE, Attack.SLOW, Effect.NONE, 100, 100,
    Wave.TRIANGLE, Attack.SLOW, Effect.NONE, 30, 50, 33);
flexFX.performFlexFX("TEST-2PART", 300, 250, 1000)
pause(500);

// create and perform a 3-part flexFX
flexFX.create3PartFlexFX("TEST-3PART", 50, 50,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 200, 100,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 100, 100,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 150, 50, 33, 33);
flexFX.performFlexFX("TEST-3PART", 800, 250, 1000)
pause(500);

// create and perform a double flexFX
flexFX.createDoubleFlexFX("TEST-DOUBLE", 95, 50,
    Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 100, 100,
    70, 100,
    Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 75, 50, 45, 10);
flexFX.performFlexFX("TEST-DOUBLE", 800, 250, 1000)
pause(500);

// now exercise built-in sounds and moods
let testMoods = false
let choice = 0;
basic.showNumber(choice + 1);
let top = 10;
input.onButtonPressed(Button.A, function () {
    choice = (++choice) % top;
    basic.showNumber(choice + 1);
})
input.onButtonPressed(Button.B, function () {
     if (testMoods){
        doMood(choice + 1);
     } else {
         doSound(choice + 1);
    }
})
input.onButtonPressed(Button.AB, function() {
    if (testMoods){
        testMoods=false;
        top = 10;
    } else {
        testMoods = true;
        top = 8;
    }
    let choice = 0;
    basic.showNumber(choice + 1);
})