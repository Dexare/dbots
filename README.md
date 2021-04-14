<img src="https://get.snaz.in/AFabfTm.png" height="50">

A [Dexare](https://github.com/Dexare/Dexare) module for [dbots](https://dbots.js.org).

```sh
npm install @dexare/dbots
```

```js
const { DexareClient } = require('dexare');
const DBotsModule = require('@dexare/dbots');

const config = {
  // All props in this config are optional, defaults are shown unless told otherwise
  dbots: {
    // The keys to use for the supported services, the default is an empty object
    keys: {
      discordbotsgg: '…',
      topgg: '…',
      lsterminalink: '…',
      carbon: '…'
    },
    // How often (in milliseconds) the poster should post its stats
    interval: 1800000,
    // Whether to autopost when the client is ready
    autopost: true,
    // The custom services to post to: https://dbots.js.org/#/docs/main/latest/examples/custom-service
    customServices: []
  }
}

const client = new DexareClient(config);
client.loadModules(DBotsModule);
// ...
```
