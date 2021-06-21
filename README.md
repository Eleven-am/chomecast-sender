# chomecast-sender
A completely typed chromecast sender application

## Description
This is a CAF-Sender application completely built in Typescript with support for on and off event listeners.

#### Usage
###### ES6
`import Chromecast from 'chomecast-sender';`

###### CJS
`const Chromecast = require('chomecast-sender');`

###### Initialisation
`const cast = new Chromecast(receiverApplicationId)`

#### Available methods

```
import Chromecast from 'chomecast-sender';
const cast = new Chromecast(receiverApplicationId);

cast.connect();
cast.disconnect();
cast.seek(50);
cast.volume(0.2);
cast.playPause();
cast.muteUnmute();
cast.castMedia(HTMLVideoElement);
await cast.send(namespaceObject);

cast.on(castEvents.EventType.AVAILABLE, event: CastEvent => {
  //..code goes here
})

cast.off(castEvents.EventType.AVAILABLE, event: CastEvent => {
   //..code goes here
})
```

For list of available events check out the CastEventType
