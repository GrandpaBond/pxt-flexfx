// *********** test codes **********

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
