let RiskManagement = require('metaapi.cloud-sdk').RiskManagement;
let EquityBalanceListener = require('metaapi.cloud-sdk').EquityBalanceListener;

// your MetaApi API token
let token = process.env.TOKEN || '<put in your token here>';
// your MetaApi account id
// the account must have field riskManagementApiEnabled set to true
let accountId = process.env.ACCOUNT_ID || '<put in your account id here>';
let domain = process.env.DOMAIN;

const riskManagement = new RiskManagement(token, {domain});
const riskManagementApi = riskManagement.riskManagementApi;

class ExampleEquityBalanceListener extends EquityBalanceListener {
  async onEquityOrBalanceUpdated(equityBalanceData) {
    console.log('equity balance update received', equityBalanceData);
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
    // adding an equity balance listener
    let equityBalanceListener = new ExampleEquityBalanceListener();
    let listenerId = riskManagementApi.addEquityBalanceListener(equityBalanceListener, accountId);

    console.log('Streaming equity balance for 1 minute...');
    await new Promise(res => setTimeout(res, 1000 * 60));
    riskManagementApi.removeEquityBalanceListener(listenerId);
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

main();
