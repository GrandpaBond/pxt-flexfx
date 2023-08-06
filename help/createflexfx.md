
# createFlexFX
- Creates a tuneable recipe for a simple sound-expression

## Block view

    create simple FlexFX: $id 
     using wave-shape $wave
          with attack $attack
           and effect $effect
     pitch profile goes from $startPitchPercent
                          to $endPitchPercent
    volume profile goes from $startVolPercent
                          to $endVolPercent
    
## parameters
 
 **id** is the string identifying this FlexFX
 **wave** sets the character of the sound
 **attack** sets the speed of movement through the pitch & volume profiles
 **effect** optionally adds vibrato or tremelo to the sound
 **startPitchPercent,**
 **endPitchPercent** define the pitch profile relative to the performed pitch
 **startVolPercent,**
 **endVolPercent** define the volume profile relative to the performed volume

Here is an example:
```block
flexFX.createFlexFX("Ting", 100, 100,
    Wave.TRIANGLE, Attack.FAST, Effect.NONE, 100, 10);
```
This FlexFX defines a bell-like sound of constant pitch with a rapidly fading volume