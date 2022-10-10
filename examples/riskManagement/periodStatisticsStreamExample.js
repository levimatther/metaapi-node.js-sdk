let RiskManagement = require('metaapi.cloud-sdk').RiskManagement;
let PeriodStatisticsListener = require('metaapi.cloud-sdk').PeriodStatisticsListener;

// your MetaApi API token
let token = process.env.TOKEN || '<put in your token here>';
// your MetaApi account id
// the account must have field riskManagementApiEnabled set to true
let accountId = process.env.ACCOUNT_ID || '<put in your account id here>';
let domain = process.env.DOMAIN;

const riskManagement = new RiskManagement(token, {domain});
const riskManagementApi = riskManagement.riskManagementApi;

class ExamplePeriodStatisticsListener extends PeriodStatisticsListener {
  async onPeriodStatisticsUpdated(periodStatisticsEvent) {
    console.log('period statistics updated', periodStatisticsEvent);
  }

  async onPeriodStatisticsCompleted() {
    console.log('period completed event received');
  }

  async onTrackerCompleted(){
    console.log('tracker completed event received');
  }

  async onConnected() {
    console.log('on connected event received');
  }

  async onDisconnected() {
    console.log('on disconnected event received');
  }
}

async function main() {
  try {
    // creating a tracker
    let trackerId = await riskManagementApi.createTracker(accountId, {
      name: 'example-tracker',
      absoluteDrawdownThreshold: 5,
      period: 'day'
    });
    console.log('Created an event tracker ' + trackerId.id);

    // adding an period statistics listener
    let periodStatisticsListener = new ExamplePeriodStatisticsListener();
    let listenerId = riskManagementApi.addPeriodStatisticsListener(periodStatisticsListener, accountId, trackerId);

    console.log('Streaming period statistics events for 1 minute...');
    await new Promise(res => setTimeout(res, 1000 * 60));
    riskManagementApi.removePeriodStatisticsListener(listenerId);

    let equityChart = await riskManagementApi.getEquityChart(accountId);
    console.log('period statistics', JSON.stringify(equityChart));
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

main();
