```package
pxt-flexfx=github:grandpabond/pxt-flexfx
```
## Spacing-out background Plays  #flexFX-playSilence                 
```sig 
flexFX.playSilence(ms) 
``` 
  
When queueing-up a series of Plays, you may not always want them to follow-on straightaway.   Use this function to space-out your Plays, by adding a silent pause onto the Play-list. 
 
> ``||flexFX:ms||`` : specifies the length of the gap in milliseconds.
   
This example plays three bell-sounds in the background, separated by gaps of 1.5 seconds: 

```block 
flexFX.playFlexFX("ting", true, music.Note.G5, 100, 400); 
flexFX.playSilence(1500); 
flexFX.playFlexFX("ting", true, music.Note.E5, 175, 400); 
flexFX.playSilence(1500); 
flexFX.playFlexFX("ting", true, music.Note.C5, 250, 1600); 
``` 
