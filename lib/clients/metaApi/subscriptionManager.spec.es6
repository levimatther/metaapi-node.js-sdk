import SubscriptionManager from './subscriptionManager';
import sinon from 'sinon';
import TimeoutError from '../timeoutError';
import { TooManyRequestsError } from '../errorHandler';

/**
 * @test {SubscriptionManager}
 */
describe('SubscriptionManager', () => {
  let sandbox;
  let clock;
  let manager;
  let client;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(async () => {  
    const socketInstances = [{socket: {connected: true}}, {socket: {connected: false}}];
    client = {
      subscribe: () => {},
      connect: () => {},
      connected: (socketInstanceIndex) => socketInstances[socketInstanceIndex].socket.connected,
      socketInstances: socketInstances,
      socketInstancesByAccounts: {accountId: 0}
    };
    clock = sinon.useFakeTimers({shouldAdvanceTime: true});
    manager = new SubscriptionManager(client);
  });

  afterEach(async () => {
    sandbox.restore();
    clock.restore();
  });

  /**
   * @test {SubscriptionManager#subscribe}
   */
  it('should subscribe to terminal', async () => {
    sandbox.stub(client, 'subscribe').resolves();
    setTimeout(() => {
      manager.cancelSubscribe('accountId:0');
    }, 50);
    await manager.subscribe('accountId');
    sinon.assert.calledWith(client.subscribe, 'accountId', undefined);
  });

  /**
   * @test {SubscriptionManager#subscribe}
   */
  it('should retry subscribe if no response received', async () => {
    const response = {type: 'response', accountId: 'accountId', requestId: 'requestId'};
    sandbox.stub(client, 'subscribe')
      .onFirstCall().resolves(new TimeoutError('timeout'))
      .onSecondCall().resolves(response)
      .onThirdCall().resolves(response);
    setTimeout(() => {
      manager.cancelSubscribe('accountId:0');
    }, 3600);
    manager.subscribe('accountId');
    await clock.tickAsync(10000);
    sinon.assert.calledTwice(client.subscribe);
    sinon.assert.calledWith(client.subscribe, 'accountId', undefined);
  });

  /**
   * @test {SubscriptionManager#subscribe}
   */
  it('should wait for recommended time if too many requests error received', async () => {
    const response = {type: 'response', accountId: 'accountId', requestId: 'requestId'};
    sandbox.stub(client, 'subscribe')
      .onFirstCall().rejects(new TooManyRequestsError('timeout', {
        periodInMinutes: 60, maxRequestsForPeriod: 10000,
        type: 'LIMIT_REQUEST_RATE_PER_USER',
        recommendedRetryTime: new Date(Date.now() + 5000)}))
      .onSecondCall().resolves(response)
      .onThirdCall().resolves(response);
    manager.subscribe('accountId');
    await clock.tickAsync(3600);
    sinon.assert.callCount(client.subscribe, 1);
    await clock.tickAsync(2000);
    manager.cancelSubscribe('accountId:0');
    sinon.assert.callCount(client.subscribe, 2);
  });

  /**
   * @test {SubscriptionManager#onReconnected}
   */
  it('should cancel all subscriptions on reconnect', async () => {
    sandbox.stub(client, 'subscribe').resolves();
    client.socketInstancesByAccounts = {accountId: 0, accountId2: 0, accountId3: 1};
    manager.subscribe('accountId');
    manager.subscribe('accountId2');
    manager.subscribe('accountId3');
    await clock.tickAsync(1000);
    manager.onReconnected(0, []);
    await clock.tickAsync(5000);
    sinon.assert.callCount(client.subscribe, 4);
  });

  /**
   * @test {SubscriptionManager#onReconnected}
   */
  it('should restart subscriptions on reconnect', async () => {
    sandbox.stub(client, 'connect').resolves();
    sandbox.stub(client, 'subscribe').resolves();
    client.socketInstancesByAccounts = {accountId: 0, accountId2: 0, accountId3: 0};
    manager.subscribe('accountId');
    manager.subscribe('accountId2');
    manager.subscribe('accountId3');
    await clock.tickAsync(1000);
    manager.onReconnected(0, ['accountId', 'accountId2']);
    await clock.tickAsync(1000);
    sinon.assert.callCount(client.subscribe, 5);
  });

  /**
   * @test {SubscriptionManager#onReconnected}
   */
  it('should wait until previous subscription ends on reconnect', async () => {
    sandbox.stub(client, 'subscribe').callsFake(async () => {
      await new Promise(res => setTimeout(res, 2000));
    });

    sandbox.stub(client, 'connect').resolves();
    client.socketInstancesByAccounts = {accountId: 0};
    manager.subscribe('accountId');
    await clock.tickAsync(1000);
    manager.onReconnected(0, ['accountId']);
    await clock.tickAsync(2000);
    sinon.assert.callCount(client.subscribe, 2);
  });

  /**
   * @test {SubscriptionManager#subscribe}
   */
  it('should not send multiple subscribe requests at the same time', async () => {
    sandbox.stub(client, 'subscribe').resolves();
    manager.subscribe('accountId');
    manager.subscribe('accountId');
    await clock.tickAsync(1000);
    manager.cancelSubscribe('accountId:0');
    await clock.tickAsync(2500);
    sinon.assert.calledWith(client.subscribe, 'accountId', undefined);
    sinon.assert.calledOnce(client.subscribe);
  });

  /**
   * @test {SubscriptionManager#onTimeout}
   */
  it('should resubscribe on timeout', async () => {
    sandbox.stub(client, 'subscribe').resolves();
    client.socketInstances[0].socket.connected = true;
    client.socketInstancesByAccounts.accountId2 = 1;
    setTimeout(() => {
      manager.cancelSubscribe('accountId:0');
      manager.cancelSubscribe('accountId2:0');
    }, 100);
    manager.onTimeout('accountId');
    manager.onTimeout('accountId2');
    await clock.tickAsync(200);
    sinon.assert.calledWith(client.subscribe, 'accountId', undefined);
    sinon.assert.callCount(client.subscribe, 1);
  });

  /**
   * @test {SubscriptionManager#onTimeout}
   */
  it('should not retry subscribe to terminal if connection is closed', async () => {
    sandbox.stub(client, 'subscribe').resolves();
    client.socketInstances[0].socket.connected = false;
    setTimeout(() => {
      manager.cancelSubscribe('accountId:0');
    }, 100);
    manager.onTimeout('accountId');
    await clock.tickAsync(200);
    sinon.assert.notCalled(client.subscribe);
  });

  /**
   * @test {SubscriptionManager#cancelAccount}
   */
  it('should cancel all subscriptions for an account', async () => {
    sandbox.stub(client, 'subscribe').resolves();
    manager.subscribe('accountId', 0);
    manager.subscribe('accountId', 1);
    await clock.tickAsync(100);
    manager.cancelAccount('accountId');
    await clock.tickAsync(500);
    sinon.assert.calledTwice(client.subscribe);
  });

  /**
   * @test {SubscriptionManager#cancelSubscribe}
   */
  it('should destroy subscribe process on cancel', async () => {
    const subscribe = sandbox.stub().resolves();
    const delaySubscribe = async () => {
      await subscribe();
      await new Promise(res => setTimeout(res, 400));
    };
    client.subscribe = delaySubscribe;
    manager.subscribe('accountId');
    await clock.tickAsync(50);
    manager.cancelSubscribe('accountId:0');
    await clock.tickAsync(50);
    manager.subscribe('accountId');
    await clock.tickAsync(50);
    sinon.assert.calledTwice(subscribe);
  });

  /**
   * @test {SubscriptionManager#cancelSubscribe}
   */
  it('should check if account is subscribing', async () => {
    manager.subscribe('accountId', 1);
    await clock.tickAsync(50);
    sinon.assert.match(manager.isAccountSubscribing('accountId'), true);
    sinon.assert.match(manager.isAccountSubscribing('accountId', 0), false);
    sinon.assert.match(manager.isAccountSubscribing('accountId', 1), true);
  });

});
