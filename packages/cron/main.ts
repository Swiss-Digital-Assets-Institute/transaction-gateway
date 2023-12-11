import { AccountBalanceQuery, AccountId, Client, Hbar, PrivateKey, TransferTransaction } from '@hashgraph/sdk';
import Vault from 'hashi-vault-js';
import { executorWalletSecretKey, refillerWalletSecretKey } from './constants';
import { ConfigurationType, SecretAccountInfoData } from './definitions';
const mount = '/secret';

export async function main() {
  const config = await getConfig();
  const client = getClient(config);
  const refillAmount = await getRefillAmount(config, client);
  if (refillAmount.toString() === '0') {
    console.log('Cron execution happened, no need to refill.');
    return;
  }

  const transaction = new TransferTransaction()
    .addHbarTransfer(config.refillerAccountId, -refillAmount)
    .addHbarTransfer(config.executorAccountId, refillAmount)
    .freezeWith(client);
  const signTx = await transaction.sign(config.refillerPrivateKey);
  const txResponse = await signTx.execute(client);
  const receipt = await txResponse.getReceipt(client);

  //Obtain the transaction consensus status
  const transactionStatus = receipt.status;
  console.log('The transaction consensus status ' + transactionStatus.toString());
  console.log(`Refill executed successfully. ${refillAmount.toString()} tokens transferred.`);
}

async function getRefillAmount(config: ConfigurationType, client: Client) {
  const balance = await new AccountBalanceQuery().setAccountId(config.executorAccountId).execute(client);
  let refillAmount = new Hbar(0).toBigNumber();
  const hbarBalanceBN = balance.hbars.toBigNumber();
  const balanceThresholdBN = new Hbar(config.balanceThreshold).toBigNumber();
  const balanceTargetBN = new Hbar(config.balanceTarget).toBigNumber();

  if (hbarBalanceBN.comparedTo(balanceThresholdBN) <= 0) refillAmount = balanceTargetBN.minus(hbarBalanceBN);
  return refillAmount;
}

async function getConfig(): Promise<ConfigurationType> {
  validateEnv();

  const vault = new Vault({
    https: true,
    baseUrl: process.env.VAULT_API_URL,
    timeout: 5000,
    proxy: false,
  });
  const loginResponse = await vault.loginWithAppRole(
    process.env.VAULT_APP_ROLE_ID,
    process.env.VAULT_APP_ROLE_SECRET_ID,
  );
  const token = loginResponse.client_token;
  const executorWalletInfo: SecretAccountInfoData = (
    await vault.readKVSecret(token, executorWalletSecretKey, null, mount)
  ).data;
  const refillerWalletInfo: SecretAccountInfoData = (
    await vault.readKVSecret(token, refillerWalletSecretKey, null, mount)
  ).data;
  return {
    hashgraphNetwork: process.env.HASHGRAPH_NETWORK,
    executorAccountId: AccountId.fromString(executorWalletInfo.accountId),
    refillerAccountId: AccountId.fromString(refillerWalletInfo.accountId),
    refillerPrivateKey: PrivateKey.fromStringED25519(refillerWalletInfo.privateKey),
    balanceThreshold: +process.env.BALANCE_THRESHOLD,
    balanceTarget: +process.env.BALANCE_TARGET,
  };
}

function validateEnv() {
  const envArray = [
    process.env.VAULT_API_URL,
    process.env.VAULT_APP_ROLE_ID,
    process.env.VAULT_APP_ROLE_SECRET_ID,
    process.env.HASHGRAPH_NETWORK,
    process.env.BALANCE_THRESHOLD,
    process.env.BALANCE_TARGET,
  ];
  if (!envArray.some((value) => !!value)) throw new Error('Some of the env params are not specified. Aborting.');
}

function getClient(config: ConfigurationType) {
  let client: Client;
  switch (config.hashgraphNetwork) {
    case 'mainnet':
      client = Client.forMainnet();
      break;
    case 'testnet':
      client = Client.forTestnet();
      break;
    case 'preview':
      client = Client.forPreviewnet();
      break;
    default:
      client = Client.forTestnet();
  }
  client.setOperator(config.refillerAccountId, config.refillerPrivateKey);
  return client;
}
