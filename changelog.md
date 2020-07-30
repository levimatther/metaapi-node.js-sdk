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
