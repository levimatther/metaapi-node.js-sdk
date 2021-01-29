12.1.0
  - add name and login to account infomration

12.0.0
  - added API to retrieve CopyFactory slave trading log
  - fixed race condition when orders are being added and completed fast
  - breaking change: changed signatures of SynchronizationListener methods
  - add reliability field
  - add symbol mapping setting to CopyFactory
  - fix quote health check logic

11.0.2
  - fix packet logger import

11.0.1
  - fixed reservoir export
  - removed packet logger import for browser version

11.0.0
  - breaking change: MetaApi options are now specified via an object
  - breaking change: CopyFactory options are now specified via an object
  - added traffic logger
  - added close by order support
  - added stop limit order support
  - bugfix MetatraderAccount.connect method to throw an error to avoid creating broken connections
  - add marginMode, tradeAllowed, investorMode fields to account information
  - breaking change: waitSynchronized to synchronize CopyFactory and RPC applications by default
  - improvements to position profit and acount equity tracking on client side
  - real-time updates for margin fields in account information
  - breaking change: uptime now returns uptime measurements over several timeframes (1h, 1d, 1w)
  - do not retry synchronization after MetaApiConnection is closed
  - added option for reverse copying in CopyFactory API
  - added ConnectionHealthMonitor.serverHealthStatus API to retrieve health status of server-side applications
  - added option to specify account-wide stopout and risk limits in CopyFactory API
  - track MetaApi application latencies
  - send RPC requests via RPC application
  - increased synchronization stability
  - added extensions for accounts
  - added metadata field for accounts to store extra information together with account

10.1.1
  - bugfix synchronization failover logic

10.1.0
  - added support for portfolio strategies (i.e. the strategies which include several other member strategies) to CopyFactory API

10.0.1
  - bugfix health monitor

10.0.0
  - added incoming commissions to CopyFactory history API
  - breaking change: refactored resetStopout method in CopyFactory trading API. Changed method name, added strategyId parameter.
  - retry synchronization if synchronization attempt have failed
  - restore market data subscriptions on successful synchronization
  - added capability to monitor terminal connection health and measure terminal connection uptime
  - change packet orderer timeout from 10 seconds to 1 minute to accomodate for slower connections

9.1.0
  - added API to register MetaTrader demo accounts
  - fixed packet orderer to do not cause unnecessary resynchronization

9.0.0
  - added contractSize field to MetatraderSymbolSpecification model
  - added quoteSessions and tradeSessions to MetatraderSymbolSpecification model
  - added more fields to MetatraderSymbolSpecification model
  - breaking change: add onPositionsReplaced and onOrderReplaced events into SynchronizationListener and no longer invoke onPositionUpdated and onOrderUpdated during initial synchronization
  - removed excessive log message from subscribe API
  - breaking change: introduced synchronizationStated event to increase synchronization stability
  - fixed wrong expected sequence number of synchronization packet in the log message
  - added positionId field to CopyFactoryTransaction model

8.0.2
  - bugfix packet ordering algorithm

8.0.1
  - bugfix packet ordering algorithm

8.0.0
  - breaking change: removed the `timeConverter` field from the account, replaced it with `brokerTimezone` and `brokerDSTSwitchTimezone` fields in the provisioning profile instead
  - added originalComment and clientId fields to MetatraderPosition
  - fixed occasional fake synchronization timeouts in waitSynchronized method
  - breaking change: changed API contract of MetaApiConnection.waitSynchronized method
  - added tags for MetaApi accounts
  - minor adjustments to equity calculation algorithm
  - added method to wait for active resynchronization tasks are completed in configuration CopyFactory api
  - added the ability to set the start time for synchronization, used for tests
  - resynchronize on lost synchronization packet to ensure local terminal state consistency

7.4.0
  - added application setting to MetaApi class to make it possible to launch several MetaApi applications in parallel on the same account

7.3.1
  - renamed tradeCopyingSlippageInPercentPoints -> tradeCopyingSlippageInBasisPoints in CopyFactory history API

7.3.0
  - added latency and slippage metrics to CopyFactory trade copying API
  - added CopyFactory configuration client method retrieving active resynchronization tasks
  - improved description of CopyFactory account resynchronizing in readme
  - made it possible to use MetaApi class in interaction tests

7.2.0
  - Fix CopyFactory domain default value
  - Added time fields in broker timezone to objects
  - Added time fields to MetatraderSymbolPrice model

7.1.4
  - Adjust CopyFactory defaults

7.1.3
  - Changes to load balancing algorithm

7.1.2
  - fix CopyFactory getter undefined values
  - fix typos in the examples

7.1.1
  - fix simultaneous multiple file writes by one connection

7.1.0
  - now only one MetaApiConnection can be created per account at the same time to avoid history storage errors

7.0.0
  - Prepared for upcoming breaking change in API: added sticky session support
  - added quoteStreamingIntervalInSeconds field to account to configure quote streaming interval
  - added description field to CopyFactory strategy

6.3.2
  - fixes to package.json keywords

6.3.1
  - fixes to package.json keywords

6.3.0
  - added CopyFactory trade-copying API

6.2.0
  - added reason field to position, order and deal
  - added fillingMode field to MetaTraderOrder model
  - added order expiration time and type

6.1.0
  - added ability to select filling mode when placing a market order, in trade options
  - added ability to set expiration options when placing a pending order, in trade options

6.0.4
  - Add code sample download video to readme

6.0.3
  - fix typo in readme.md

6.0.2
  - update readme.md

6.0.1
  - update readme.md

6.0.0
  - breaking change: rename closePositionBySymbol -> closePosition**s**BySymbol
  - added pagination and more filters to getAccounts API
  - added slippage option to trades
  - added fillingModes to symbol specification
  - added executionMode to symbol specification
  - added logic to throw an error if streaming API is invoked in automatic synchronization mode
  - added code samples for created account
  - added the ability to work in web apps
  - added the ability to retrieve Metatrader account by account access token
  - added the verification access depending on the token to API
  - added websocket and http client timeouts

5.0.2
  - minor bugfix

5.0.1
  - fixed issue with missing numeric/string response code in TradeError

5.0.0
  - breaking change: moved comment and clientId arguments from MetaApiConnection trade methods to options argument
  - added magic trade option to let you specify distinct magic number (expert advisor id) on each trade
  - added manualTrades field to account model so that it is possible to configure if MetaApi should place manual trades on the account
  - prepare MetatraderAccountApi class for upcoming breaking change in the API

4.0.2
  - save history on disk

4.0.1
  - add fields to trade result to match upcoming MetaApi contract

4.0.0
  - breaking change: throw TradeError in case of trade error
  - rename trade response fields so that they are more meaningful

3.0.1
  - previous release was broken, releasing one more time

3.0.0
  - improved account connection stability
  - added platform field to MetatraderAccountInformation model
  - breaking change: changed synchronize and waitSynchronized API to allow for unique synchronization id to be able to track when the synchronization is complete in situation when other clients have also requested a concurrent synchronization on the account
  - breaking change: changed default wait interval to 1s in wait* methods
  
2.0.0
  - breaking change: removed volume as an argument from a modifyOrder function
  - mark account as disconnected if there is no status notification for a long time

1.1.5
  - increased synchronization speed

1.1.4
  - renamed github repository

1.1.3
  - minor bugfixes
  - add API to update provisioning profiles ana MT accounts
  - update current price of the pending order when current price updates
  - removed support for advanced profiles and provisioning profile type since they are no longer used

1.1.2
  - fixed magic field type in docs and code samples
  - MemoryHistoryStorage bugfixes
  - esdoc fixes

1.1.1
  - extended waitSynchronized method logic so that it can be used for accounts in automatic synchronization mode
  - Breaking change: renamed MetaApiConnection synchronized property to isSynchronized method

1.0.19
  - mentioned code examples in readme.md

1.0.18
  - added license clarifications
  - added example code based on user requests

1.0.17
  - improve stability on reconnect in user synchronization mode
  - added commission field to Metatrader position model

1.0.15
  - added clarifications to readme.md regarding SDK documentation

1.0.14
  - add MetaApiConnection.waitSynchronized API to wait until terminal state synchronization has completed. Should be used for accounts in use synchronization mode.

1.0.13
  - change websocket client subscription protocol

1.0.12
  - add MemoryHistoryStorage to exports

1.0.11
  - fixed WS API url

1.0.10
  - fixed code examples in readme.md

1.0.9
  - fixed import in index.es6
  - fixed logic of self-hosted account deletion

1.0.7
  - Initial release
