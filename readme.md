# metaapi.cloud SDK for node.js

MetaApi is a powerful forex trading API for MetaTrader 4 and MetaTrader 5 terminals.

MetaApi is available in cloud and self-hosted options.

Official REST and websocket API documentation: [https://metaapi.cloud/docs/client/](https://metaapi.cloud/docs/client/)

Please note that this SDK provides an abstraction over REST and websocket API to simplify your application logic.

For more information about SDK APIs please check esdoc documentation in source codes located inside lib folder of this npm package.

## Installation
```bash
npm install --save metaapi.cloud-sdk
```

## Obtaining MetaApi token
You can obtain MetaApi token via [https://app.metaapi.cloud/token](https://app.metaapi.cloud/token) UI.

## Working code examples
You can find code examples at [examples folder of our github repo](https://github.com/agiliumtrade-ai/metaapi-node.js-client/tree/master/examples) or in the examples folder of the npm package.

We have composed a [short guide explaining how to use the example code](https://metaapi.cloud/docs/client/usingCodeExamples)

## Connecting to MetaApi
Please use [https://app.metaapi.cloud/token](https://app.metaapi.cloud/token) web UI to obtain your API token and supply it to the MetaApi class constructor.

```javacsript
import MetaApi from 'metaapi.cloud-sdk';

const token = '...';
const api = new MetaApi(token);
```

## Managing MetaTrader accounts (API servers for MT accounts)
Before you can use the API you have to add an MT account to MetaApi and start an API server for it.

However, before you can create an account, you have to create a provisioning profile.

### Managing provisioning profiles via web UI
You can manage provisioning profiles here: [https://app.metaapi.cloud/provisioning-profiles](https://app.metaapi.cloud/provisioning-profiles)

### Creating a provisioning profile via API
```javascript
// if you do not have created a provisioning profile for your broker,
// you should do it before creating an account
const provisioningProfile = await api.provisioningProfileApi.createProvisioningProfile({
  name: 'My profile',
  version: 5
});
// servers.dat file is required for MT5 profile and can be found inside
// config directory of your MetaTrader terminal data folder. It contains
// information about available broker servers
await provisioningProfile.uploadFile('servers.dat', '/path/to/servers.dat');
// for MT4, you should upload an .srv file instead
await provisioningProfile.uploadFile('broker.srv', '/path/to/broker.srv');
```

### Retrieving existing provisioning profiles via API
```javascript
const provisioningProfiles = await api.provisioningProfileApi.getProvisioningProfiles();
const provisioningProfile = await api.provisioningProfileApi.getProvisioningProfile('profileId');
```

### Updating a provisioning profile via API
```javascript
await provisioningProfile.update({name: 'New name'});
// for MT5, you should upload a servers.dat file
await provisioningProfile.uploadFile('servers.dat', '/path/to/servers.dat');
// for MT4, you should upload an .srv file instead
await provisioningProfile.uploadFile('broker.srv', '/path/to/broker.srv');
```

### Removing a provisioning profile
```javascript
await provisioningProfile.remove();
```

### Managing MetaTrader accounts (API servers) via web UI
You can manage MetaTrader accounts here: [https://app.metaapi.cloud/accounts](https://app.metaapi.cloud/accounts)

### Create a MetaTrader account (API server) via API
```javascript
const account = await api.metatraderAccountApi.createAccount({
  name: 'Trading account #1',
  type: 'cloud',
  login: '1234567',
  // password can be investor password for read-only access
  password: 'qwerty',
  server: 'ICMarketsSC-Demo',
  // synchronizationMode can be 'automatic' for RPC access or 'user' if you
  // want to keep track of terminal state in real-time (e.g. if you are
  // developing a EA or trading strategy)
  synchronizationMode: 'automatic',
  provisioningProfileId: provisioningProfile.id,
  //algorithm used to parse your broker timezone. Supported values are
  // icmarkets for America/New_York DST switch and roboforex for EET
  // DST switch (the values will be changed soon)
  timeConverter: 'roboforex',
  application: 'MetaApi',
  magic: 123456
});
```

### Retrieving existing accounts via API
```javascript
// specifying provisioning profile id is optional
const provisioningProfileId = '...';
const accounts = await api.metatraderAccountApi.getAccounts(provisioningProfileId);
const account = await api.metatraderAccountApi.getAccount('accountId');
```

### Updating an existing account via API
```javascript
await account.update({
  name: 'Trading account #1',
  login: '1234567',
  // password can be investor password for read-only access
  password: 'qwerty',
  server: 'ICMarketsSC-Demo',
  // synchronizationMode can be 'automatic' for RPC access or 'user' if you
  // want to keep track of terminal state in real-time (e.g. if you are
  // developing a EA or trading strategy)
  synchronizationMode: 'automatic'
});
```

### Removing an account
```javascript
await account.remove();
```

### Deploying, undeploying and redeploying an account (API server) via API
```javascript
await account.deploy();
await account.undeploy();
await account.redeploy();
```

## Access MetaTrader account via RPC API
RPC API let you query the trading terminal state. You should use
RPC API if you develop trading monitoring apps like myfxbook or other
simple trading apps.

You should create your account with automatic synchronization mode if
all you need is RPC API.

### Query account information, positions, orders and history via RPC API
```javascript
const connection = await account.connect();

await connection.waitSynchronized();

// retrieve balance and equity
console.log(await connection.getAccountInformation());
// retrieve open positions
console.log(await connection.getPositions());
// retrieve a position by id
console.log(await connection.getPosition('1234567'));
// retrieve pending orders
console.log(await connection.getOrders());
// retrieve a pending order by id
console.log(await connection.getOrder('1234567'));
// retrieve history orders by ticket
console.log(await connection.getHistoryOrdersByTicket('1234567'));
// retrieve history orders by position id
console.log(await connection.getHistoryOrdersByPosition('1234567'));
// retrieve history orders by time range
console.log(await connection.getHistoryOrdersByTimeRange(startTime, endTime));
// retrieve history deals by ticket
console.log(await connection.getDealsByTicket('1234567'));
// retrieve history deals by position id
console.log(await connection.getDealsByPosition('1234567'));
// retrieve history deals by time range
console.log(await connection.getDealsByTimeRange(startTime, endTime));
```

### Query contract specifications and quotes via RPC API
```javascript
const connection = await account.connect();

await connection.waitSynchronized();

// first, subscribe to market data
await connection.subscribeToMarketData('GBPUSD');

// read constract specification
console.log(await connection.getSymbolSpecification('GBPUSD'));
// read current price
console.log(await connection.getSymbolPrice('GBPUSD'));
```

### Use real-time streaming API
Real-time streaming API is good for developing trading applications like trade copiers or automated trading strategies.
The API synchronizes the terminal state locally so that you can query local copy of the terminal state really fast.

In order to use this API you need to create an account with `user` synchronization mode.

#### Synchronizing and reading teminal state
```javascript
const account = await api.metatraderAccountApi.getAccount('accountId');

// account.synchronizationMode must be equal to 'user' at this point

// access local copy of terminal state
const terminalState = connection.terminalState;

// wait until synchronization completed
await connection.waitSynchronized();

console.log(terminalState.connected);
console.log(terminalState.connectedToBroker);
console.log(terminalState.accountInformation);
console.log(terminalState.positions);
console.log(terminalState.orders);
// symbol specifications
console.log(terminalState.specifications);
console.log(terminalState.specification('EURUSD'));
console.log(terminalState.price('EURUSD'));

// access history storage
historyStorage = connection.historyStorage;

// both orderSynchronizationFinished and dealSynchronizationFinished
// should be true once history synchronization have finished
console.log(historyStorage.orderSynchronizationFinished);
console.log(historyStorage.dealSynchronizationFinished);
```

#### Overriding local history storage
By default history is stored in memory only. You can override history storage to save trade history to a persistent storage like MongoDB database.
```javascript
import {HistoryStorage} from 'metaapi.cloud-sdk';

class MongodbHistoryStorage extends HistoryStorage {
  // implement the abstract methods, see MemoryHistoryStorage for sample
  // implementation
}

let historyStorage = new MongodbHistoryStorage();

// Note: if you will not specify history storage, then in-memory storage
// will be used (instance of MemoryHistoryStorage)
const connection = await account.connect(historyStorage);

// access history storage
historyStorage = connection.historyStorage;

// invoke other methods provided by your history storage implementation
console.log(await historyStorage.yourMethod());
```

#### Receiving synchronization events
You can override SynchronizationListener in order to receive synchronization event notifications, such as account/position/order/history updates or symbol quote updates.
```javascript
import {SynchronizationListener} from 'metaapi.cloud-sdk';

// receive synchronization event notifications
// first, implement your listener
class MySynchronizationListener extends SynchronizationListener {
  // override abstract methods you want to receive notifications for
}

// now add the listener
const listener = new MySynchronizationListener();
connection.addSynchronizationListener(listener);

// remove the listener when no longer needed
connection.removeSynchronizationListener(listener);
```

### Execute trades (both RPC and streaming APIs)
```javascript
const connection = await account.connect();

await connection.waitSynchronized();

// trade
console.log(await connection.createMarketBuyOrder('GBPUSD', 0.07, 0.9, 2.0, 'comment', 'TE_GBPUSD_7hyINWqAlE'));
console.log(await connection.createMarketSellOrder('GBPUSD', 0.07, 2.0, 0.9, 'comment', 'TE_GBPUSD_7hyINWqAlE'));
console.log(await connection.createLimitBuyOrder('GBPUSD', 0.07, 1.0, 0.9, 2.0, 'comment', 'TE_GBPUSD_7hyINWqAlE'));
console.log(await connection.createLimitSellOrder('GBPUSD', 0.07, 1.5, 2.0, 0.9, 'comment', 'TE_GBPUSD_7hyINWqAlE'));
console.log(await connection.createStopBuyOrder('GBPUSD', 0.07, 1.5, 0.9, 2.0, 'comment', 'TE_GBPUSD_7hyINWqAlE'));
console.log(await connection.createStopSellOrder('GBPUSD', 0.07, 1.0, 2.0, 0.9, 'comment', 'TE_GBPUSD_7hyINWqAlE'));
console.log(await connection.modifyPosition('46870472', 2.0, 0.9));
console.log(await connection.closePositionPartially('46870472', 0.9));
console.log(await connection.closePosition('46870472'));
console.log(await connection.closePositionBySymbol('EURUSD'));
console.log(await connection.modifyOrder('46870472', 0.07, 1.0, 2.0, 0.9));
console.log(await connection.cancelOrder('46870472'));

// Note: trade methods does not throw an exception if terminal have refused
// the trade, thus you must check the returned value
const result = await connection.createMarketBuyOrder('GBPUSD', 0.07, 0.9, 2.0, 'comment', 'TE_GBPUSD_7hyINWqAlE');
if (result.description !== 'TRADE_RETCODE_DONE') {
  console.error('Trade was rejected by MetaTrader terminal with ' + result.description + ' error');
}
```

Keywords: MetaTrader API, MetaTrader REST API, MetaTrader websocket API,
MetaTrader 5 API, MetaTrader 5 REST API, MetaTrader 5 websocket API,
MetaTrader 4 API, MetaTrader 4 REST API, MetaTrader 4 websocket API,
MT5 API, MT5 REST API, MT5 websocket API, MT4 API, MT4 REST API,
MT4 websocket API, MetaTrader SDK, MetaTrader SDK, MT4 SDK, MT5 SDK,
MetaTrader 5 SDK, MetaTrader 4 SDK, MetaTrader node.js SDK, MetaTrader 5
node.js SDK, MetaTrader 4 node.js SDK, MT5 node.js SDK, MT4 node.js SDK,
FX REST API, Forex REST API, Forex websocket API, FX websocket API, FX
SDK, Forex SDK, FX node.js SDK, Forex node.js SDK, Trading API, Forex
API, FX API, Trading SDK, Trading REST API, Trading websocket API,
Trading SDK, Trading node.js SDK
