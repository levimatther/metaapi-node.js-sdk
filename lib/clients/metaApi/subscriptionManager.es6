/**
 * Subscription manager to handle account subscription logic
 */
export default class SubscriptionManager {

  /**
   * Constructs the subscription manager
   * @param {MetaApiWebsocketClient} websocketClient websocket client to use for sending requests
   */
  constructor(websocketClient) {
    this._websocketClient = websocketClient;
    this._subscriptions = {};
  }

  /**
   * Schedules to send subscribe requests to an account until cancelled
   * @param {String} accountId id of the MetaTrader account
   * @param {Number} instanceIndex instance index
   */
  async subscribe(accountId, instanceIndex) {
    const client = this._websocketClient;
    let instanceId = accountId + ':' + (instanceIndex || 0);
    if(!this._subscriptions[instanceId]) {
      this._subscriptions[instanceId] = {
        shouldRetry: true,
        task: null,
        waitTask: null,
        future: null
      };
      let subscribeRetryIntervalInSeconds = 3;
      while(this._subscriptions[instanceId].shouldRetry) {
        let resolveSubscribe;
        this._subscriptions[instanceId].task = {promise: new Promise((res) => {
          resolveSubscribe = res;
        })};
        this._subscriptions[instanceId].task.resolve = resolveSubscribe;
        // eslint-disable-next-line no-inner-declarations
        async function subscribeTask() {
          try {
            await client.subscribe(accountId, instanceIndex);
          } catch (err) {
            if(err.name === 'TooManyRequestsError') {
              const retryTime = new Date(err.metadata.recommendedRetryTime).getTime();
              if (Date.now() + subscribeRetryIntervalInSeconds * 1000 < retryTime) {
                await new Promise(res => setTimeout(res, retryTime - Date.now() -
                  subscribeRetryIntervalInSeconds * 1000));
              }
            }
          }
          resolveSubscribe();
        }
        subscribeTask();
        await this._subscriptions[instanceId].task.promise;
        if(!this._subscriptions[instanceId].shouldRetry) {
          break;
        }
        const retryInterval = subscribeRetryIntervalInSeconds;
        subscribeRetryIntervalInSeconds = Math.min(subscribeRetryIntervalInSeconds * 2, 300);
        let resolve;
        let subscribePromise = new Promise((res) => {
          resolve = res;
        });
        this._subscriptions[instanceId].waitTask = setTimeout(() => {
          resolve(true);
        }, retryInterval * 1000);
        this._subscriptions[instanceId].future = {resolve, promise: subscribePromise};
        const result = await this._subscriptions[instanceId].future.promise;
        this._subscriptions[instanceId].future = null;
        if (!result) {
          break;
        }
      }
      delete this._subscriptions[instanceId];
    }
  }

  /**
   * Cancels active subscription tasks for an instance id
   * @param {String} instanceId instance id to cancel subscription task for
   */
  cancelSubscribe(instanceId) {
    if(this._subscriptions[instanceId]) {
      const subscription = this._subscriptions[instanceId];
      if(subscription.future) {
        subscription.future.resolve(false);
        clearTimeout(subscription.waitTask);
      }
      if(subscription.task) {
        subscription.task.resolve(false);
      }
      subscription.shouldRetry = false;
    }
  }

  /**
   * Cancels active subscription tasks for an account
   * @param {String} accountId account id to cancel subscription tasks for
   */
  cancelAccount(accountId) {
    for(let instanceId of Object.keys(this._subscriptions).filter(key => key.startsWith(accountId))) {
      this.cancelSubscribe(instanceId);
    }
  }

  /**
   * Invoked on account timeout.
   * @param {String} accountId id of the MetaTrader account
   * @param {Number} instanceIndex instance index
   */
  onTimeout(accountId, instanceIndex) {
    if(this._websocketClient.connected) {
      this.subscribe(accountId, instanceIndex);
    }
  }

  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {String} accountId id of the MetaTrader account
   * @param {Number} instanceIndex instance index
   */
  async onDisconnected(accountId, instanceIndex) {
    await new Promise(res => setTimeout(res, Math.max(Math.random() * 5, 1) * 1000));
    this.subscribe(accountId, instanceIndex);
  }

  /**
   * Invoked when connection to MetaApi websocket API restored after a disconnect.
   */
  onReconnected() {
    for(let instanceId of Object.keys(this._subscriptions)){
      this.cancelSubscribe(instanceId);
    }
  }
}