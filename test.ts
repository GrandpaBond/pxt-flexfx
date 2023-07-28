// *********** test codes **********

music.setBuiltInSpeakerEnabled(false);
/* create and perform a simple flexFX
flexFX.createFlexFX("Ting", 100, 100,
    Wave.TRIANGLE, Attack.FAST, Effect.NONE, 100, 10);
flexFX.performFlexFX("Ting", Note.G5, 250, 400);
flexFX.performFlexFX("Ting", Note.E5, 250, 400);
flexFX.performFlexFX("Ting", Note.C5, 250, 1600);
pause(1000);

// create and perform a Horn 2-part flexFX
flexFX.create2PartFlexFX("Horn", 5, 50,
    Wave.SAWTOOTH, Attack.FAST, Effect.NONE, 100, 100,
    Wave.SINE, Attack.SLOW, Effect.NONE, 100, 80, 7);
flexFX.performFlexFX("Horn", Note.E3, 255, 900);
flexFX.performFlexFX("Horn", Note.G3, 255, 300);
flexFX.performFlexFX("Horn", Note.G3, 255, 1200);
flexFX.performFlexFX("Horn", Note.E3, 255, 900);
flexFX.performFlexFX("Horn", Note.D3, 255, 300);
flexFX.performFlexFX("Horn", Note.C3, 255, 1200);
flexFX.performFlexFX("Horn", Note.D3, 255, 600);
flexFX.performFlexFX("Horn", Note.E3, 255, 600);
flexFX.performFlexFX("Horn", Note.G3, 255, 600);
flexFX.performFlexFX("Horn", Note.E3, 255, 600);
flexFX.performFlexFX("Horn", Note.D3, 255, 2400);
pause(1000);
*/
// create and perform a 3-part flexFX
flexFX.create3PartFlexFX("TEST-3PART", 50, 50,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 200, 100,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 100, 100,
    Wave.SQUARE, Attack.SLOW, Effect.NONE, 150, 50, 33, 33);
flexFX.performFlexFX("TEST-3PART", 200, 250, 1000);
pause(400);
flexFX.performFlexFX("TEST-3PART", 400, 250, 1000);
pause(400);
flexFX.performFlexFX("TEST-3PART", 800, 250, 1000);
pause(400);
flexFX.performFlexFX("TEST-3PART", 1600, 250, 1000);
pause(1000);
/*
// create and perform a double flexFX
flexFX.createDoubleFlexFX("NeeNaw", 95, 80,
    Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 100, 100,
    70, 100,
    Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 75, 80, 45, 10);
flexFX.performFlexFX("NeeNaw", 800, 16, 1000);
flexFX.performFlexFX("NeeNaw", 800, 32, 1000);
flexFX.performFlexFX("NeeNaw", 800, 64, 1000);
flexFX.performFlexFX("NeeNaw", 800, 128, 1000);
flexFX.performFlexFX("NeeNaw", 800, 255, 1000);
flexFX.performFlexFX("NeeNaw", 750, 255, 1000);
flexFX.performFlexFX("NeeNaw", 750, 128, 1000);
flexFX.performFlexFX("NeeNaw", 750, 64, 1000);
flexFX.performFlexFX("NeeNaw", 750, 32, 1000);
flexFX.performFlexFX("NeeNaw", 750, 16, 1000);
pause(1000);
*/
/* create and perform a Violin 3-part flexFX
flexFX.create3PartFlexFX("Violin", 1, 100,
    Wave.SAWTOOTH, Attack.FAST, Effect.NONE, 100, 75,
    Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 100, 75,
    Wave.SAWTOOTH, Attack.SLOW, Effect.NONE, 10, 100, 10, 85);

flexFX.performFlexFX("Violin", Note.E5, 250, 300);
flexFX.performFlexFX("Violin", Note.A5, 250, 900);
flexFX.performFlexFX("Violin", Note.E5, 250, 300);
flexFX.performFlexFX("Violin", Note.F5, 250, 900);
flexFX.performFlexFX("Violin", Note.D5, 250, 300);
flexFX.performFlexFX("Violin", Note.E5, 250, 150);
flexFX.performFlexFX("Violin", Note.D5, 250, 150);
flexFX.performFlexFX("Violin", Note.C5, 250, 150);
flexFX.performFlexFX("Violin", Note.E5, 250, 150);
flexFX.performFlexFX("Violin", Note.D5, 250, 150);
flexFX.performFlexFX("Violin", Note.C5, 250, 150);
flexFX.performFlexFX("Violin", Note.B4, 250, 150);
flexFX.performFlexFX("Violin", Note.D5, 250, 150);
flexFX.performFlexFX("Violin", Note.C5, 250, 300);
flexFX.performFlexFX("Violin", Note.A4, 250, 900);

pause(500);
*/