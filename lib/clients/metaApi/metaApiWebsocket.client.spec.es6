'use strict';

import should from 'should';
import sinon from 'sinon';
import MetaApiWebsocketClient from './metaApiWebsocket.client';
import Server from 'socket.io';
import NotConnectedError from './notConnectedError';
import {InternalError} from '../errorHandler';

const metaapiApiUrl = 'https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * @test {MetaApiWebsocketClient}
 */
describe('MetaApiWebsocketClient', () => {

  let io;
  let server;
  let client;
  let sandbox;

  before(() => {
    client = new MetaApiWebsocketClient('token', {application: 'application', 
      domain: 'project-stock.agiliumlabs.cloud', requestTimeout: 1.5, retryOpts: {retries: 3}});
    client.url = 'http://localhost:6784';
    sandbox = sinon.createSandbox();
  });

  beforeEach(async () => {
    io = new Server(6784, {path: '/ws'});
    io.on('connect', socket => {
      server = socket;
      if (socket.request._query['auth-token'] !== 'token') {
        socket.emit({error: 'UnauthorizedError', message: 'Authorization token invalid'});
        socket.close();
      }
    });
    sandbox.stub(client._synchronizationThrottler, 'activeSynchronizationIds').get(() => []);
    await client.connect();
  });

  afterEach(async () => {
    sandbox.restore();
    let resolve;
    let promise = new Promise(res => resolve = res);
    client.close();
    io.close(() => resolve());
    await promise;
  });

  /**
   * @test {MetaApiWebsocketClient#_tryReconnect}
   */
  it('should change client id on reconnect', async () => {
    const clock = sinon.useFakeTimers({shouldAdvanceTime: true});
    client.close();
    let clientId;
    let connectAmount = 0;
    io.on('connect', socket => {
      connectAmount++;
      socket.request.headers['client-id'].should.equal(socket.request._query.clientId);
      socket.request.headers['client-id'].should.not.equal(clientId);
      socket.request._query.clientId.should.not.equal(clientId);
      clientId = socket.request._query.clientId;
      socket.disconnect();
    });
    await client.connect();
    await new Promise(res => setTimeout(res, 50));
    await clock.tickAsync(1500);
    await new Promise(res => setTimeout(res, 50));
    connectAmount.should.be.aboveOrEqual(2);
    clock.restore();
  });

  /**
   * @test {MetaApiWebsocketClient#getAccountInformation}
   */
  it('should retrieve MetaTrader account information from API', async () => {
    let accountInformation = {
      broker: 'True ECN Trading Ltd',
      currency: 'USD',
      server: 'ICMarketsSC-Demo',
      balance: 7319.9,
      equity: 7306.649913200001,
      margin: 184.1,
      freeMargin: 7120.22,
      leverage: 100,
      marginLevel: 3967.58283542
    };
    server.on('request', data => {
      if (data.type === 'getAccountInformation' && data.accountId === 'accountId' &&
        data.application === 'RPC') {
        server.emit('response', {
          type: 'response', accountId: data.accountId, requestId: data.requestId,
          accountInformation
        });
      }
    });
    let actual = await client.getAccountInformation('accountId');
    actual.should.match(accountInformation);
  });

  /**
   * @test {MetaApiWebsocketClient#getPositions}
   */
  it('should retrieve MetaTrader positions from API', async () => {
    let positions = [{
      id: '46214692',
      type: 'POSITION_TYPE_BUY',
      symbol: 'GBPUSD',
      magic: 1000,
      time: new Date('2020-04-15T02:45:06.521Z'),
      updateTime: new Date('2020-04-15T02:45:06.521Z'),
      openPrice: 1.26101,
      currentPrice: 1.24883,
      currentTickValue: 1,
      volume: 0.07,
      swap: 0,
      profit: -85.25999999999966,
      commission: -0.25,
      clientId: 'TE_GBPUSD_7hyINWqAlE',
      stopLoss: 1.17721,
      unrealizedProfit: -85.25999999999901,
      realizedProfit: -6.536993168992922e-13
    }];
    server.on('request', data => {
      if (data.type === 'getPositions' && data.accountId === 'accountId' && data.application === 'RPC') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, positions});
      }
    });
    let actual = await client.getPositions('accountId');
    actual.should.match(positions);
  });

  /**
   * @test {MetaApiWebsocketClient#getPosition}
   */
  it('should retrieve MetaTrader position from API by id', async () => {
    let position = {
      id: '46214692',
      type: 'POSITION_TYPE_BUY',
      symbol: 'GBPUSD',
      magic: 1000,
      time: new Date('2020-04-15T02:45:06.521Z'),
      updateTime: new Date('2020-04-15T02:45:06.521Z'),
      openPrice: 1.26101,
      currentPrice: 1.24883,
      currentTickValue: 1,
      volume: 0.07,
      swap: 0,
      profit: -85.25999999999966,
      commission: -0.25,
      clientId: 'TE_GBPUSD_7hyINWqAlE',
      stopLoss: 1.17721,
      unrealizedProfit: -85.25999999999901,
      realizedProfit: -6.536993168992922e-13
    };
    server.on('request', data => {
      if (data.type === 'getPosition' && data.accountId === 'accountId' && data.positionId === '46214692' &&
        data.application === 'RPC') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, position});
      }
    });
    let actual = await client.getPosition('accountId', '46214692');
    actual.should.match(position);
  });

  /**
   * @test {MetaApiWebsocketClient#getOrders}
   */
  it('should retrieve MetaTrader orders from API', async () => {
    let orders = [{
      id: '46871284',
      type: 'ORDER_TYPE_BUY_LIMIT',
      state: 'ORDER_STATE_PLACED',
      symbol: 'AUDNZD',
      magic: 123456,
      platform: 'mt5',
      time: new Date('2020-04-20T08:38:58.270Z'),
      openPrice: 1.03,
      currentPrice: 1.05206,
      volume: 0.01,
      currentVolume: 0.01,
      comment: 'COMMENT2'
    }];
    server.on('request', data => {
      if (data.type === 'getOrders' && data.accountId === 'accountId' && data.application === 'RPC') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, orders});
      }
    });
    let actual = await client.getOrders('accountId');
    actual.should.match(orders);
  });

  /**
   * @test {MetaApiWebsocketClient#getOrder}
   */
  it('should retrieve MetaTrader order from API by id', async () => {
    let order = {
      id: '46871284',
      type: 'ORDER_TYPE_BUY_LIMIT',
      state: 'ORDER_STATE_PLACED',
      symbol: 'AUDNZD',
      magic: 123456,
      platform: 'mt5',
      time: new Date('2020-04-20T08:38:58.270Z'),
      openPrice: 1.03,
      currentPrice: 1.05206,
      volume: 0.01,
      currentVolume: 0.01,
      comment: 'COMMENT2'
    };
    server.on('request', data => {
      if (data.type === 'getOrder' && data.accountId === 'accountId' && data.orderId === '46871284' &&
        data.application === 'RPC') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, order});
      }
    });
    let actual = await client.getOrder('accountId', '46871284');
    actual.should.match(order);
  });

  /**
   * @test {MetaApiWebsocketClient#getHistoryOrdersByTicket}
   */
  it('should retrieve MetaTrader history orders from API by ticket', async () => {
    let historyOrders = [{
      clientId: 'TE_GBPUSD_7hyINWqAlE',
      currentPrice: 1.261,
      currentVolume: 0,
      doneTime: new Date('2020-04-15T02:45:06.521Z'),
      id: '46214692',
      magic: 1000,
      platform: 'mt5',
      positionId: '46214692',
      state: 'ORDER_STATE_FILLED',
      symbol: 'GBPUSD',
      time: new Date('2020-04-15T02:45:06.260Z'),
      type: 'ORDER_TYPE_BUY',
      volume: 0.07
    }];
    server.on('request', data => {
      if (data.type === 'getHistoryOrdersByTicket' && data.accountId === 'accountId' && data.ticket === '46214692' &&
        data.application === 'RPC') {
        server.emit('response', {
          type: 'response', accountId: data.accountId, requestId: data.requestId, historyOrders,
          synchronizing: false
        });
      }
    });
    let actual = await client.getHistoryOrdersByTicket('accountId', '46214692');
    actual.should.match({historyOrders, synchronizing: false});
  });

  /**
   * @test {MetaApiWebsocketClient#getHistoryOrdersByPosition}
   */
  it('should retrieve MetaTrader history orders from API by position', async () => {
    let historyOrders = [{
      clientId: 'TE_GBPUSD_7hyINWqAlE',
      currentPrice: 1.261,
      currentVolume: 0,
      doneTime: new Date('2020-04-15T02:45:06.521Z'),
      id: '46214692',
      magic: 1000,
      platform: 'mt5',
      positionId: '46214692',
      state: 'ORDER_STATE_FILLED',
      symbol: 'GBPUSD',
      time: new Date('2020-04-15T02:45:06.260Z'),
      type: 'ORDER_TYPE_BUY',
      volume: 0.07
    }];
    server.on('request', data => {
      if (data.type === 'getHistoryOrdersByPosition' && data.accountId === 'accountId' &&
        data.positionId === '46214692' && data.application === 'RPC') {
        server.emit('response', {
          type: 'response', accountId: data.accountId, requestId: data.requestId, historyOrders,
          synchronizing: false
        });
      }
    });
    let actual = await client.getHistoryOrdersByPosition('accountId', '46214692');
    actual.should.match({historyOrders, synchronizing: false});
  });

  /**
   * @test {MetaApiWebsocketClient#getHistoryOrdersByTimeRange}
   */
  it('should retrieve MetaTrader history orders from API by time range', async () => {
    let historyOrders = [{
      clientId: 'TE_GBPUSD_7hyINWqAlE',
      currentPrice: 1.261,
      currentVolume: 0,
      doneTime: new Date('2020-04-15T02:45:06.521Z'),
      id: '46214692',
      magic: 1000,
      platform: 'mt5',
      positionId: '46214692',
      state: 'ORDER_STATE_FILLED',
      symbol: 'GBPUSD',
      time: new Date('2020-04-15T02:45:06.260Z'),
      type: 'ORDER_TYPE_BUY',
      volume: 0.07
    }];
    server.on('request', data => {
      if (data.type === 'getHistoryOrdersByTimeRange' && data.accountId === 'accountId' &&
        data.startTime === '2020-04-15T02:45:00.000Z' && data.endTime === '2020-04-15T02:46:00.000Z' &&
        data.offset === 1 && data.limit === 100 && data.application === 'RPC') {
        server.emit('response', {
          type: 'response', accountId: data.accountId, requestId: data.requestId, historyOrders,
          synchronizing: false
        });
      }
    });
    let actual = await client.getHistoryOrdersByTimeRange('accountId', new Date('2020-04-15T02:45:00.000Z'),
      new Date('2020-04-15T02:46:00.000Z'), 1, 100);
    actual.should.match({historyOrders, synchronizing: false});
  });

  /**
   * @test {MetaApiWebsocketClient#getDealsByTicket}
   */
  it('should retrieve MetaTrader deals from API by ticket', async () => {
    let deals = [{
      clientId: 'TE_GBPUSD_7hyINWqAlE',
      commission: -0.25,
      entryType: 'DEAL_ENTRY_IN',
      id: '33230099',
      magic: 1000,
      platform: 'mt5',
      orderId: '46214692',
      positionId: '46214692',
      price: 1.26101,
      profit: 0,
      swap: 0,
      symbol: 'GBPUSD',
      time: new Date('2020-04-15T02:45:06.521Z'),
      type: 'DEAL_TYPE_BUY',
      volume: 0.07
    }];
    server.on('request', data => {
      if (data.type === 'getDealsByTicket' && data.accountId === 'accountId' && data.ticket === '46214692' &&
        data.application === 'RPC') {
        server.emit('response', {
          type: 'response', accountId: data.accountId, requestId: data.requestId, deals,
          synchronizing: false
        });
      }
    });
    let actual = await client.getDealsByTicket('accountId', '46214692');
    actual.should.match({deals, synchronizing: false});
  });

  /**
   * @test {MetaApiWebsocketClient#getDealsByPosition}
   */
  it('should retrieve MetaTrader deals from API by position', async () => {
    let deals = [{
      clientId: 'TE_GBPUSD_7hyINWqAlE',
      commission: -0.25,
      entryType: 'DEAL_ENTRY_IN',
      id: '33230099',
      magic: 1000,
      platform: 'mt5',
      orderId: '46214692',
      positionId: '46214692',
      price: 1.26101,
      profit: 0,
      swap: 0,
      symbol: 'GBPUSD',
      time: new Date('2020-04-15T02:45:06.521Z'),
      type: 'DEAL_TYPE_BUY',
      volume: 0.07
    }];
    server.on('request', data => {
      if (data.type === 'getDealsByPosition' && data.accountId === 'accountId' && data.positionId === '46214692' &&
        data.application === 'RPC') {
        server.emit('response', {
          type: 'response', accountId: data.accountId, requestId: data.requestId, deals,
          synchronizing: false
        });
      }
    });
    let actual = await client.getDealsByPosition('accountId', '46214692');
    actual.should.match({deals, synchronizing: false});
  });

  /**
   * @test {MetaApiWebsocketClient#getDealsByTimeRange}
   */
  it('should retrieve MetaTrader deals from API by time range', async () => {
    let deals = [{
      clientId: 'TE_GBPUSD_7hyINWqAlE',
      commission: -0.25,
      entryType: 'DEAL_ENTRY_IN',
      id: '33230099',
      magic: 1000,
      platform: 'mt5',
      orderId: '46214692',
      positionId: '46214692',
      price: 1.26101,
      profit: 0,
      swap: 0,
      symbol: 'GBPUSD',
      time: new Date('2020-04-15T02:45:06.521Z'),
      type: 'DEAL_TYPE_BUY',
      volume: 0.07
    }];
    server.on('request', data => {
      if (data.type === 'getDealsByTimeRange' && data.accountId === 'accountId' &&
        data.startTime === '2020-04-15T02:45:00.000Z' && data.endTime === '2020-04-15T02:46:00.000Z' &&
        data.offset === 1 && data.limit === 100 && data.application === 'RPC') {
        server.emit('response', {
          type: 'response', accountId: data.accountId, requestId: data.requestId, deals,
          synchronizing: false
        });
      }
    });
    let actual = await client.getDealsByTimeRange('accountId', new Date('2020-04-15T02:45:00.000Z'),
      new Date('2020-04-15T02:46:00.000Z'), 1, 100);
    actual.should.match({deals, synchronizing: false});
  });

  /**
   * @test {MetaApiWebsocketClient#removeHistory}
   */
  it('should remove history from API', async () => {
    let requestReceived = false;
    server.on('request', data => {
      if (data.type === 'removeHistory' && data.accountId === 'accountId' && data.application === 'app') {
        requestReceived = true;
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
      }
    });
    await client.removeHistory('accountId', 'app');
    requestReceived.should.be.true();
  });

  /**
   * @test {MetaApiWebsocketClient#removeApplication}
   */
  it('should remove application from API', async () => {
    let requestReceived = false;
    server.on('request', data => {
      if (data.type === 'removeApplication' && data.accountId === 'accountId' && data.application === 'application') {
        requestReceived = true;
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
      }
    });
    await client.removeApplication('accountId');
    requestReceived.should.be.true();
  });

  /**
   * @test {MetaApiWebsocketClient#trade}
   */
  it('should execute a trade via new API version', async () => {
    let trade = {
      actionType: 'ORDER_TYPE_SELL',
      symbol: 'AUDNZD',
      volume: 0.07
    };
    let response = {
      numericCode: 10009,
      stringCode: 'TRADE_RETCODE_DONE',
      message: 'Request completed',
      orderId: '46870472'
    };
    server.on('request', data => {
      data.trade.should.match(trade);
      if (data.type === 'trade' && data.accountId === 'accountId' && data.application === 'application') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, response});
      }
    });
    let actual = await client.trade('accountId', trade);
    actual.should.match(response);
  });

  /**
   * @test {MetaApiWebsocketClient#trade}
   */
  it('should execute a trade via API and receive trade error from old API version', async () => {
    let trade = {
      actionType: 'ORDER_TYPE_SELL',
      symbol: 'AUDNZD',
      volume: 0.07
    };
    let response = {
      error: 10006,
      description: 'TRADE_RETCODE_REJECT',
      message: 'Request rejected',
      orderId: '46870472'
    };
    server.on('request', data => {
      data.trade.should.match(trade);
      if (data.type === 'trade' && data.accountId === 'accountId' && data.application === 'application') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, response});
      }
    });
    try {
      await client.trade('accountId', trade);
      should.fail('Trade error expected');
    } catch (err) {
      err.message.should.equal('Request rejected');
      err.name.should.equal('TradeError');
      err.stringCode.should.equal('TRADE_RETCODE_REJECT');
      err.numericCode.should.equal(10006);
    }
  });

  /**
   * @test {MetaApiWebsocketClient#subscribe}
   */
  it('should connect to MetaTrader terminal', async () => {
    let requestReceived = false;
    server.on('request', data => {
      if (data.type === 'subscribe' && data.accountId === 'accountId' && data.application === 'application' &&
        data.instanceIndex === 1) {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        requestReceived = true;
      }
    });
    await client.subscribe('accountId', 1);
    await new Promise(res => setTimeout(res, 50));
    requestReceived.should.be.true();
  });

  /**
   * @test {MetaApiWebsocketClient#subscribe}
   */
  it('should return error if connect to MetaTrader terminal failed', async () => {
    let requestReceived = false;
    server.on('request', data => {
      if (data.type === 'subscribe' && data.accountId === 'accountId' && data.application === 'application') {
        requestReceived = true;
      }
      server.emit('processingError', {
        id: 1, error: 'NotAuthenticatedError', message: 'Error message',
        requestId: data.requestId
      });
    });
    let success = true;
    try {
      await client.subscribe('accountId');
      success = false;
    } catch (err) {
      err.name.should.equal('NotConnectedError');
    }
    success.should.be.true();
    requestReceived.should.be.true();
  });

  /**
   * @test {MetaApiWebsocketClient#reconnect}
   */
  it('should reconnect to MetaTrader terminal', async () => {
    let requestReceived = false;
    server.on('request', data => {
      if (data.type === 'reconnect' && data.accountId === 'accountId' && data.application === 'application') {
        requestReceived = true;
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
      }
    });
    await client.reconnect('accountId');
    requestReceived.should.be.true();
  });

  /**
   * @test {MetaApiWebsocketClient#getSymbolSpecification}
   */
  it('should retrieve symbol specification from API', async () => {
    let specification = {
      symbol: 'AUDNZD',
      tickSize: 0.00001,
      minVolume: 0.01,
      maxVolume: 100,
      volumeStep: 0.01
    };
    server.on('request', data => {
      if (data.type === 'getSymbolSpecification' && data.accountId === 'accountId' && data.symbol === 'AUDNZD' &&
        data.application === 'RPC') {
        server.emit('response', {
          type: 'response', accountId: data.accountId, requestId: data.requestId,
          specification
        });
      }
    });
    let actual = await client.getSymbolSpecification('accountId', 'AUDNZD');
    actual.should.match(specification);
  });

  /**
   * @test {MetaApiWebsocketClient#getSymbolPrice}
   */
  it('should retrieve symbol price from API', async () => {
    let price = {
      symbol: 'AUDNZD',
      bid: 1.05297,
      ask: 1.05309,
      profitTickValue: 0.59731,
      lossTickValue: 0.59736
    };
    server.on('request', data => {
      if (data.type === 'getSymbolPrice' && data.accountId === 'accountId' && data.symbol === 'AUDNZD' &&
        data.application === 'RPC') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, price});
      }
    });
    let actual = await client.getSymbolPrice('accountId', 'AUDNZD');
    actual.should.match(price);
  });

  /**
   * @test {MetaApiWebsocketClient#getCandle}
   */
  it('should retrieve candle from API', async () => {
    let candle = {
      symbol: 'AUDNZD',
      timeframe: '15m',
      time: new Date('2020-04-07T03:45:00.000Z'),
      brokerTime: '2020-04-07 06:45:00.000',
      open: 1.03297,
      high: 1.06309,
      low: 1.02705,
      close: 1.043,
      tickVolume: 1435,
      spread: 17,
      volume: 345
    };
    server.on('request', data => {
      if (data.type === 'getCandle' && data.accountId === 'accountId' && data.symbol === 'AUDNZD' &&
        data.application === 'RPC' && data.timeframe === '15m') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, candle});
      }
    });
    let actual = await client.getCandle('accountId', 'AUDNZD', '15m');
    actual.should.match(candle);
  });

  /**
   * @test {MetaApiWebsocketClient#getTick}
   */
  it('should retrieve latest tick from API', async () => {
    let tick = {
      symbol: 'AUDNZD',
      time: new Date('2020-04-07T03:45:00.000Z'),
      brokerTime: '2020-04-07 06:45:00.000',
      bid: 1.05297,
      ask: 1.05309,
      last: 0.5298,
      volume: 0.13,
      side: 'buy'
    };
    server.on('request', data => {
      if (data.type === 'getTick' && data.accountId === 'accountId' && data.symbol === 'AUDNZD' &&
        data.application === 'RPC') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, tick});
      }
    });
    let actual = await client.getTick('accountId', 'AUDNZD');
    actual.should.match(tick);
  });

  /**
   * @test {MetaApiWebsocketClient#sendUptime}
   */
  it('should sent uptime stats to the server', async () => {
    server.on('request', data => {
      if (data.type === 'saveUptime' && data.accountId === 'accountId' &&
        JSON.stringify(data.uptime) === JSON.stringify({'1h': 100}) &&
        data.application === 'application') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
      }
    });
    await client.saveUptime('accountId', {'1h': 100});
  });

  it('should unsubscribe from account data', async () => {
    let response = {type: 'response', accountId: 'accountId'};
    server.on('request', data => {
      if (data.type === 'unsubscribe' && data.accountId === 'accountId') {
        server.emit('response', Object.assign({requestId: data.requestId}, response));
      }
    });
    let actual = await client.unsubscribe('accountId');
    actual.should.match(response);
  });

  describe('error handling', () => {

    /**
     * @test {MetaApiWebsocketClient#trade}
     */
    it('should handle ValidationError', async () => {
      let trade = {
        actionType: 'ORDER_TYPE_SELL',
        symbol: 'AUDNZD'
      };
      server.on('request', data => {
        server.emit('processingError', {
          id: 1, error: 'ValidationError', message: 'Validation failed',
          details: [{parameter: 'volume', message: 'Required value.'}], requestId: data.requestId
        });
      });
      try {
        await client.trade('accountId', trade);
        throw new Error('ValidationError extected');
      } catch (err) {
        err.name.should.equal('ValidationError');
        err.details.should.match([{
          parameter: 'volume',
          message: 'Required value.'
        }]);
      }
    });

    /**
     * @test {MetaApiWebsocketClient#getPosition}
     */
    it('should handle NotFoundError', async () => {
      server.on('request', data => {
        server.emit('processingError', {
          id: 1, error: 'NotFoundError', message: 'Position id 1234 not found',
          requestId: data.requestId
        });
      });
      try {
        await client.getPosition('accountId', '1234');
        throw new Error('NotFoundError extected');
      } catch (err) {
        err.name.should.equal('NotFoundError');
      }
    });

    /**
     * @test {MetaApiWebsocketClient#getPosition}
     */
    it('should handle NotSynchronizedError', async () => {
      server.on('request', data => {
        server.emit('processingError', {
          id: 1, error: 'NotSynchronizedError', message: 'Error message',
          requestId: data.requestId
        });
      });
      try {
        await client.getPosition('accountId', '1234');
        throw new Error('NotSynchronizedError extected');
      } catch (err) {
        err.name.should.equal('NotSynchronizedError');
      }
    }).timeout(8000);

    /**
     * @test {MetaApiWebsocketClient#getPosition}
     */
    it('should handle NotConnectedError', async () => {
      server.on('request', data => {
        server.emit('processingError', {
          id: 1, error: 'NotAuthenticatedError', message: 'Error message',
          requestId: data.requestId
        });
      });
      try {
        await client.getPosition('accountId', '1234');
        throw new Error('NotConnectedError extected');
      } catch (err) {
        err.name.should.equal('NotConnectedError');
      }
    });

    /**
     * @test {MetaApiWebsocketClient#getPosition}
     */
    it('should handle other errors', async () => {
      server.on('request', data => {
        server.emit('processingError', {
          id: 1, error: 'Error', message: 'Error message',
          requestId: data.requestId
        });
      });
      try {
        await client.getPosition('accountId', '1234');
        throw new Error('InternalError extected');
      } catch (err) {
        err.name.should.equal('InternalError');
      }
    }).timeout(8000);

  });

  describe('connection status synchronization', () => {

    afterEach(() => {
      client.removeAllListeners();
    });

    it('should process authenticated synchronization event', async () => {
      let listener = {
        onConnected: () => {
        }
      };
      sandbox.stub(listener, 'onConnected').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', instanceIndex: 1, replicas: 2});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onConnected, 1, 2);
    });

    it('should process authenticated synchronization event with session id', async () => {
      let listener = {
        onConnected: () => {
        }
      };
      sandbox.stub(listener, 'onConnected').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', instanceIndex: 2,
        replicas: 4, sessionId: 'wrong'});
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', instanceIndex: 1,
        replicas: 2, sessionId: client._sessionId});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.callCount(listener.onConnected, 1);
      sinon.assert.calledWith(listener.onConnected, 1, 2);
    });

    it('should process broker connection status event', async () => {
      let listener = {
        onBrokerConnectionStatusChanged: () => {
        }
      };
      sandbox.stub(listener, 'onBrokerConnectionStatusChanged').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 1});
      server.emit('synchronization', {type: 'status', accountId: 'accountId', host: 'ps-mpa-1', connected: true,
        instanceIndex: 1});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onBrokerConnectionStatusChanged, 1, true);
    });

    it('should call an onDisconnect if there was no signal for a long time', async () => {
      const clock = sinon.useFakeTimers({shouldAdvanceTime: true});
      let listener = {
        onConnected: () => {},
        onDisconnected: () => {},
        onBrokerConnectionStatusChanged: () => {}
      };
      sandbox.stub(listener, 'onDisconnected').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 1, replicas: 2});
      server.emit('synchronization', {type: 'status', accountId: 'accountId', host: 'ps-mpa-1', connected: true,
        instanceIndex: 1});
      await new Promise(res => setTimeout(res, 50));
      await clock.tickAsync(10000);
      server.emit('synchronization', {type: 'status', accountId: 'accountId', host: 'ps-mpa-1', connected: true,
        instanceIndex: 1});
      await new Promise(res => setTimeout(res, 50));
      await clock.tickAsync(55000);
      sinon.assert.notCalled(listener.onDisconnected);
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 1, replicas: 2});
      await new Promise(res => setTimeout(res, 50));
      await clock.tickAsync(10000);
      sinon.assert.notCalled(listener.onDisconnected);
      await clock.tickAsync(55000);
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onDisconnected, 1);
      clock.restore();
    });

    it('should process server-side health status event', async () => {
      let listener = {
        onBrokerConnectionStatusChanged: () => {},
        onHealthStatus: () => {}
      };
      sandbox.stub(listener, 'onHealthStatus').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 1});
      server.emit('synchronization', {type: 'status', accountId: 'accountId', host: 'ps-mpa-1', connected: true,
        healthStatus: {restApiHealthy: true}, instanceIndex: 1});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onHealthStatus, 1, {restApiHealthy: true});
    });

    it('should process disconnected synchronization event', async () => {
      let listener = {
        onDisconnected: () => {
        }
      };
      sandbox.stub(listener, 'onDisconnected').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 1});
      server.emit('synchronization', {type: 'disconnected', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 1});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onDisconnected, 1);
    });

  });

  describe('terminal state synchronization', () => {

    afterEach(() => {
      client.removeAllListeners();
    });

    it('should only accept packets with own synchronization ids', async () => {
      let listener = {
        onAccountInformationUpdated: () => {},
      };
      sandbox.stub(listener, 'onAccountInformationUpdated').resolves();
      client.addSynchronizationListener('accountId', listener);
      sandbox.stub(client._synchronizationThrottler, 'activeSynchronizationIds').get(() => ['synchronizationId']);
      server.emit('synchronization', {type: 'accountInformation', accountId: 'accountId', 
        accountInformation: {}, instanceIndex: 1});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.callCount(listener.onAccountInformationUpdated, 1);
      server.emit('synchronization', {type: 'accountInformation', accountId: 'accountId', 
        accountInformation: {}, instanceIndex: 1, synchronizationId: 'wrong'});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.callCount(listener.onAccountInformationUpdated, 1);
      server.emit('synchronization', {type: 'accountInformation', accountId: 'accountId', 
        accountInformation: {}, instanceIndex: 1, synchronizationId: 'synchronizationId'});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.callCount(listener.onAccountInformationUpdated, 2);
    });

    /**
     * @test {MetaApiWebsocketClient#synchronize}
     */
    it('should synchronize with MetaTrader terminal', async () => {
      let requestReceived = false;
      server.on('request', data => {
        if (data.type === 'synchronize' && data.accountId === 'accountId' &&
          data.startingHistoryOrderTime === '2020-01-01T00:00:00.000Z' &&
          data.startingDealTime === '2020-01-02T00:00:00.000Z' && data.requestId === 'synchronizationId' &&
          data.application === 'application' && data.instanceIndex === 1) {
          requestReceived = true;
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        }
      });
      await client.synchronize('accountId', 1, 'synchronizationId', new Date('2020-01-01T00:00:00.000Z'),
        new Date('2020-01-02T00:00:00.000Z'));
      requestReceived.should.be.true();
    });

    it('should process synchronization started event', async () => {
      let listener = {
        onSynchronizationStarted: () => {
        }
      };
      sandbox.stub(listener, 'onSynchronizationStarted').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'synchronizationStarted', accountId: 'accountId', instanceIndex: 1});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onSynchronizationStarted, 1);
    });

    it('should synchronize account information', async () => {
      let accountInformation = {
        broker: 'True ECN Trading Ltd',
        currency: 'USD',
        server: 'ICMarketsSC-Demo',
        balance: 7319.9,
        equity: 7306.649913200001,
        margin: 184.1,
        freeMargin: 7120.22,
        leverage: 100,
        marginLevel: 3967.58283542
      };
      let listener = {
        onAccountInformationUpdated: () => {
        }
      };
      sandbox.stub(listener, 'onAccountInformationUpdated').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'accountInformation', accountId: 'accountId', accountInformation,
        instanceIndex: 1});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onAccountInformationUpdated, 1, accountInformation);
    });

    it('should synchronize positions', async () => {
      let positions = [{
        id: '46214692',
        type: 'POSITION_TYPE_BUY',
        symbol: 'GBPUSD',
        magic: 1000,
        time: new Date('2020-04-15T02:45:06.521Z'),
        updateTime: new Date('2020-04-15T02:45:06.521Z'),
        openPrice: 1.26101,
        currentPrice: 1.24883,
        currentTickValue: 1,
        volume: 0.07,
        swap: 0,
        profit: -85.25999999999966,
        commission: -0.25,
        clientId: 'TE_GBPUSD_7hyINWqAlE',
        stopLoss: 1.17721,
        unrealizedProfit: -85.25999999999901,
        realizedProfit: -6.536993168992922e-13
      }];
      let listener = {
        onPositionsReplaced: () => {
        }
      };
      sandbox.stub(listener, 'onPositionsReplaced').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'positions', accountId: 'accountId', positions, instanceIndex: 1});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onPositionsReplaced, 1, positions);
    });

    it('should synchronize orders', async () => {
      let orders = [{
        id: '46871284',
        type: 'ORDER_TYPE_BUY_LIMIT',
        state: 'ORDER_STATE_PLACED',
        symbol: 'AUDNZD',
        magic: 123456,
        platform: 'mt5',
        time: new Date('2020-04-20T08:38:58.270Z'),
        openPrice: 1.03,
        currentPrice: 1.05206,
        volume: 0.01,
        currentVolume: 0.01,
        comment: 'COMMENT2'
      }];
      let listener = {
        onOrdersReplaced: () => {
        }
      };
      sandbox.stub(listener, 'onOrdersReplaced').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'orders', accountId: 'accountId', orders, instanceIndex: 1});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onOrdersReplaced, 1, orders);
    });

    it('should synchronize history orders', async () => {
      let historyOrders = [{
        clientId: 'TE_GBPUSD_7hyINWqAlE',
        currentPrice: 1.261,
        currentVolume: 0,
        doneTime: new Date('2020-04-15T02:45:06.521Z'),
        id: '46214692',
        magic: 1000,
        platform: 'mt5',
        positionId: '46214692',
        state: 'ORDER_STATE_FILLED',
        symbol: 'GBPUSD',
        time: new Date('2020-04-15T02:45:06.260Z'),
        type: 'ORDER_TYPE_BUY',
        volume: 0.07
      }];
      let listener = {
        onHistoryOrderAdded: () => {
        }
      };
      sandbox.stub(listener, 'onHistoryOrderAdded').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'historyOrders', accountId: 'accountId', historyOrders,
        instanceIndex: 1});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onHistoryOrderAdded, 1, historyOrders[0]);
    });

    it('should synchronize deals', async () => {
      let deals = [{
        clientId: 'TE_GBPUSD_7hyINWqAlE',
        commission: -0.25,
        entryType: 'DEAL_ENTRY_IN',
        id: '33230099',
        magic: 1000,
        platform: 'mt5',
        orderId: '46214692',
        positionId: '46214692',
        price: 1.26101,
        profit: 0,
        swap: 0,
        symbol: 'GBPUSD',
        time: new Date('2020-04-15T02:45:06.521Z'),
        type: 'DEAL_TYPE_BUY',
        volume: 0.07
      }];
      let listener = {
        onDealAdded: () => {
        }
      };
      sandbox.stub(listener, 'onDealAdded').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'deals', accountId: 'accountId', deals, instanceIndex: 1});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onDealAdded, 1, deals[0]);
    });

    it('should process synchronization updates', async () => {
      let update = {
        accountInformation: {
          broker: 'True ECN Trading Ltd',
          currency: 'USD',
          server: 'ICMarketsSC-Demo',
          balance: 7319.9,
          equity: 7306.649913200001,
          margin: 184.1,
          freeMargin: 7120.22,
          leverage: 100,
          marginLevel: 3967.58283542
        },
        updatedPositions: [{
          id: '46214692',
          type: 'POSITION_TYPE_BUY',
          symbol: 'GBPUSD',
          magic: 1000,
          time: new Date('2020-04-15T02:45:06.521Z'),
          updateTime: new Date('2020-04-15T02:45:06.521Z'),
          openPrice: 1.26101,
          currentPrice: 1.24883,
          currentTickValue: 1,
          volume: 0.07,
          swap: 0,
          profit: -85.25999999999966,
          commission: -0.25,
          clientId: 'TE_GBPUSD_7hyINWqAlE',
          stopLoss: 1.17721,
          unrealizedProfit: -85.25999999999901,
          realizedProfit: -6.536993168992922e-13
        }],
        removedPositionIds: ['1234'],
        updatedOrders: [{
          id: '46871284',
          type: 'ORDER_TYPE_BUY_LIMIT',
          state: 'ORDER_STATE_PLACED',
          symbol: 'AUDNZD',
          magic: 123456,
          platform: 'mt5',
          time: new Date('2020-04-20T08:38:58.270Z'),
          openPrice: 1.03,
          currentPrice: 1.05206,
          volume: 0.01,
          currentVolume: 0.01,
          comment: 'COMMENT2'
        }],
        completedOrderIds: ['2345'],
        historyOrders: [{
          clientId: 'TE_GBPUSD_7hyINWqAlE',
          currentPrice: 1.261,
          currentVolume: 0,
          doneTime: new Date('2020-04-15T02:45:06.521Z'),
          id: '46214692',
          magic: 1000,
          platform: 'mt5',
          positionId: '46214692',
          state: 'ORDER_STATE_FILLED',
          symbol: 'GBPUSD',
          time: new Date('2020-04-15T02:45:06.260Z'),
          type: 'ORDER_TYPE_BUY',
          volume: 0.07
        }],
        deals: [{
          clientId: 'TE_GBPUSD_7hyINWqAlE',
          commission: -0.25,
          entryType: 'DEAL_ENTRY_IN',
          id: '33230099',
          magic: 1000,
          platform: 'mt5',
          orderId: '46214692',
          positionId: '46214692',
          price: 1.26101,
          profit: 0,
          swap: 0,
          symbol: 'GBPUSD',
          time: new Date('2020-04-15T02:45:06.521Z'),
          type: 'DEAL_TYPE_BUY',
          volume: 0.07
        }]
      };
      let listener = {
        onAccountInformationUpdated: () => {
        },
        onPositionUpdated: () => {
        },
        onPositionRemoved: () => {
        },
        onOrderUpdated: () => {
        },
        onOrderCompleted: () => {
        },
        onHistoryOrderAdded: () => {
        },
        onDealAdded: () => {
        }
      };
      sandbox.stub(listener, 'onAccountInformationUpdated').resolves();
      sandbox.stub(listener, 'onPositionUpdated').resolves();
      sandbox.stub(listener, 'onPositionRemoved').resolves();
      sandbox.stub(listener, 'onOrderUpdated').resolves();
      sandbox.stub(listener, 'onOrderCompleted').resolves();
      sandbox.stub(listener, 'onHistoryOrderAdded').resolves();
      sandbox.stub(listener, 'onDealAdded').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', Object.assign({type: 'update', accountId: 'accountId', instanceIndex: 1},
        update));
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onAccountInformationUpdated, 1, update.accountInformation);
      sinon.assert.calledWith(listener.onPositionUpdated, 1, update.updatedPositions[0]);
      sinon.assert.calledWith(listener.onPositionRemoved, 1, update.removedPositionIds[0]);
      sinon.assert.calledWith(listener.onOrderUpdated, 1, update.updatedOrders[0]);
      sinon.assert.calledWith(listener.onOrderCompleted, 1, update.completedOrderIds[0]);
      sinon.assert.calledWith(listener.onHistoryOrderAdded, 1, update.historyOrders[0]);
      sinon.assert.calledWith(listener.onDealAdded, 1, update.deals[0]);
    });

  });

  describe('market data synchronization', () => {

    afterEach(() => {
      client.removeAllListeners();
    });

    /**
     * @test {MetaApiWebsocketClient#_rpcRequest}
     */
    it('should retry request on failure', async () => {
      let requestCounter = 0;
      let order = {
        id: '46871284',
        type: 'ORDER_TYPE_BUY_LIMIT',
        state: 'ORDER_STATE_PLACED',
        symbol: 'AUDNZD',
        magic: 123456,
        platform: 'mt5',
        time: new Date('2020-04-20T08:38:58.270Z'),
        openPrice: 1.03,
        currentPrice: 1.05206,
        volume: 0.01,
        currentVolume: 0.01,
        comment: 'COMMENT2'
      };
      server.on('request', data => {
        if (requestCounter > 1 && data.type === 'getOrder' && data.accountId === 'accountId' &&
          data.orderId === '46871284' && data.application === 'RPC') {
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, order});
        } 
        requestCounter++;
      });
      let actual = await client.getOrder('accountId', '46871284');
      actual.should.match(order);
    }).timeout(20000);

    /**
     * @test {MetaApiWebsocketClient#_rpcRequest}
     */
    it('should not retry request on validation error', async () => {
      let requestCounter = 0;
      server.on('request', data => {
        if (requestCounter > 0 && data.type === 'subscribeToMarketData' && data.accountId === 'accountId' &&
          data.symbol === 'EURUSD' && data.application === 'application' && data.instanceIndex === 1) {
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        } else {
          server.emit('processingError', {
            id: 1, error: 'ValidationError', message: 'Error message', requestId: data.requestId
          });
        }
        requestCounter ++;
      });
      try {
        await client.subscribeToMarketData('accountId', 1, 'EURUSD');
        throw new Error('ValidationError expected');
      } catch (err) {
        err.name.should.equal('ValidationError');
      }
      sinon.assert.match(requestCounter, 1);
    }).timeout(6000);
    
    /**
     * @test {MetaApiWebsocketClient#_rpcRequest}
     */
    it('should not retry trade requests on fail', async () => {
      let requestCounter = 0;
      let trade = {
        actionType: 'ORDER_TYPE_SELL',
        symbol: 'AUDNZD',
        volume: 0.07
      };
      server.on('request', data => {
        if(requestCounter > 0) {
          sinon.assert.fail();
        }
        requestCounter++;
      });
      try {
        await client.trade(trade);
        throw new Error('TimeoutError expected');
      } catch (err) {
        err.name.should.equal('TimeoutError');
      }
    }).timeout(6000);

    /**
     * @test {MetaApiWebsocketClient#_rpcRequest}
     */
    it('should return timeout error if no server response received', async () => {
      let trade = {
        actionType: 'ORDER_TYPE_SELL',
        symbol: 'AUDNZD',
        volume: 0.07
      };
      server.on('request', data => {
      });
      try {
        await client.trade(trade);
        throw new Error('TimeoutError extected');
      } catch (err) {
        err.name.should.equal('TimeoutError');
      }
    }).timeout(20000);

    /**
     * @test {MetaApiWebsocketClient#subscribeToMarketData}
     */
    it('should subscribe to market data with MetaTrader terminal', async () => {
      let requestReceived = false;
      server.on('request', data => {
        if (data.type === 'subscribeToMarketData' && data.accountId === 'accountId' && data.symbol === 'EURUSD' &&
          data.application === 'application' && data.instanceIndex === 1 &&
          JSON.stringify(data.subscriptions) === JSON.stringify([{type: 'quotes'}])) {
          requestReceived = true;
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        }
      });
      await client.subscribeToMarketData('accountId', 1, 'EURUSD', [{type: 'quotes'}]);
      requestReceived.should.be.true();
    });

    /**
     * @test {MetaApiWebsocketClient#unsubscribeFromMarketData}
     */
    it('should unsubscribe from market data with MetaTrader terminal', async () => {
      let requestReceived = false;
      server.on('request', data => {
        if (data.type === 'unsubscribeFromMarketData' && data.accountId === 'accountId' && data.symbol === 'EURUSD' &&
          data.application === 'application' && data.instanceIndex === 1 &&
          JSON.stringify(data.subscriptions) === JSON.stringify([{type: 'quotes'}])) {
          requestReceived = true;
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        }
      });
      await client.unsubscribeFromMarketData('accountId', 1, 'EURUSD', [{type: 'quotes'}]);
      requestReceived.should.be.true();
    });

    it('should synchronize symbol specifications', async () => {
      let specifications = [{
        symbol: 'EURUSD',
        tickSize: 0.00001,
        minVolume: 0.01,
        maxVolume: 200,
        volumeStep: 0.01
      }];
      let listener = {
        onSymbolSpecificationUpdated: () => {
        }
      };
      sandbox.stub(listener, 'onSymbolSpecificationUpdated').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization',
        {type: 'specifications', accountId: 'accountId', specifications, instanceIndex: 1});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onSymbolSpecificationUpdated, 1, specifications[0]);
    });

    it('should synchronize symbol prices', async () => {
      let prices = [{
        symbol: 'AUDNZD',
        bid: 1.05916,
        ask: 1.05927,
        profitTickValue: 0.602,
        lossTickValue: 0.60203
      }];
      let listener = {
        onSymbolPriceUpdated: () => {},
        onSymbolPricesUpdated: () => {}
      };
      sandbox.stub(listener, 'onSymbolPriceUpdated').resolves();
      sandbox.stub(listener, 'onSymbolPricesUpdated').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'prices', accountId: 'accountId', prices, equity: 100, margin: 200,
        freeMargin: 400, marginLevel: 40000, instanceIndex: 1});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onSymbolPriceUpdated, 1, prices[0]);
      sinon.assert.calledWith(listener.onSymbolPricesUpdated, 1, prices, 100, 200, 400, 40000);
    });

  });

  describe('wait for server-side terminal state synchronization', () => {

    afterEach(() => {
      client.removeAllListeners();
    });

    /**
     * @test {MetaApiWebsocketClient#waitSynchronized}
     */
    it('should wait for server-side terminal state synchronization', async () => {
      let requestReceived = false;
      server.on('request', data => {
        if (data.type === 'waitSynchronized' && data.accountId === 'accountId' &&
          data.applicationPattern === 'app.*' && data.timeoutInSeconds === 10 &&
          data.application === 'application' && data.instanceIndex === 1) {
          requestReceived = true;
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        }
      });
      await client.waitSynchronized('accountId', 1, 'app.*', 10);
      requestReceived.should.be.true();
    });

  });

  describe('latency monitoring', () => {

    /**
     * @test {LatencyListener#onResponse}
     */
    it('should invoke latency listener on response', async () => {
      let accountId;
      let requestType;
      let actualTimestamps;
      let listener = {
        onResponse: (aid, type, ts) => {
          accountId = aid;
          requestType = type;
          actualTimestamps = ts;
        }
      };
      client.addLatencyListener(listener);
      let price = {};
      let timestamps;
      server.on('request', data => {
        if (data.type === 'getSymbolPrice' && data.accountId === 'accountId' && data.symbol === 'AUDNZD' &&
          data.application === 'RPC' && data.timestamps.clientProcessingStarted) {
          timestamps = Object.assign(data.timestamps, {serverProcessingStarted: new Date(),
            serverProcessingFinished: new Date()});
          timestamps.clientProcessingStarted = new Date(timestamps.clientProcessingStarted);
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, price,
            timestamps});
        }
      });
      await client.getSymbolPrice('accountId', 'AUDNZD');
      await new Promise(res => setTimeout(res, 100));
      accountId.should.equal('accountId');
      requestType.should.equal('getSymbolPrice');
      actualTimestamps.should.match(timestamps);
      should.exist(actualTimestamps.clientProcessingStarted);
      should.exist(actualTimestamps.clientProcessingFinished);
      should.exist(actualTimestamps.serverProcessingStarted);
      should.exist(actualTimestamps.serverProcessingFinished);
    });

    /**
     * @test {LatencyListener#onSymbolPrice}
     */
    it('should measure price streaming latencies', async () => {
      let prices = [{
        symbol: 'AUDNZD',
        timestamps: {
          eventGenerated: new Date(),
          serverProcessingStarted: new Date(),
          serverProcessingFinished: new Date()
        }
      }];
      let accountId;
      let symbol;
      let actualTimestamps;
      let listener = {
        onSymbolPrice: (aid, sym, ts) => {
          accountId = aid;
          symbol = sym;
          actualTimestamps = ts;
        }
      };
      client.addLatencyListener(listener);
      server.emit('synchronization', {type: 'prices', accountId: 'accountId', prices, equity: 100, margin: 200,
        freeMargin: 400, marginLevel: 40000});
      await new Promise(res => setTimeout(res, 50));
      accountId.should.equal('accountId');
      symbol.should.equal('AUDNZD');
      actualTimestamps.should.match(prices[0].timestamps);
      should.exist(actualTimestamps.clientProcessingFinished);
    });

    /**
     * @test {LatencyListener#onUpdate}
     */
    it('should measure update latencies', async () => {
      let update = {
        timestamps: {
          eventGenerated: new Date(),
          serverProcessingStarted: new Date(),
          serverProcessingFinished: new Date()
        }
      };
      let accountId;
      let actualTimestamps;
      let listener = {
        onUpdate: (aid, ts) => {
          accountId = aid;
          actualTimestamps = ts;
        }
      };
      client.addLatencyListener(listener);
      server.emit('synchronization', Object.assign({type: 'update', accountId: 'accountId'}, update));
      await new Promise(res => setTimeout(res, 50));
      accountId.should.equal('accountId');
      actualTimestamps.should.match(update.timestamps);
      should.exist(actualTimestamps.clientProcessingFinished);
    });

    /**
     * @test {LatencyListener#onTrade}
     */
    it('should proces trade latency', async () => {
      let trade = {};
      let response = {
        numericCode: 10009,
        stringCode: 'TRADE_RETCODE_DONE',
        message: 'Request completed',
        orderId: '46870472'
      };
      let timestamps = {
        clientExecutionStarted: new Date(),
        serverExecutionStarted: new Date(),
        serverExecutionFinished: new Date(),
        tradeExecuted: new Date()
      };
      let accountId;
      let actualTimestamps;
      let listener = {
        onTrade: (aid, ts) => {
          accountId = aid;
          actualTimestamps = ts;
        }
      };
      client.addLatencyListener(listener);
      server.on('request', data => {
        data.trade.should.match(trade);
        if (data.type === 'trade' && data.accountId === 'accountId' && data.application === 'application') {
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, response,
            timestamps});
        }
      });
      await client.trade('accountId', trade);
      accountId.should.equal('accountId');
      actualTimestamps.should.match(timestamps);
      should.exist(actualTimestamps.clientProcessingFinished);
    });

  });

});
