import { AccountId, Client, PrivateKey, TransferTransaction } from '@hashgraph/sdk';
import Vault from 'hashi-vault-js';
import { config } from 'dotenv';
import { executorWalletSecretKey, refillerWalletSecretKey } from './constants';
import { ConfigurationType, SecretAccountInfoData } from './definitions';
config();
const mount = '/secret';

export async function main() {
  const config = await getConfig();
  const client = getClient(config);

  const transaction = new TransferTransaction()
    .addHbarTransfer(config.refillerAccountId, -config.hbarAmount)
    .addHbarTransfer(config.executorAccountId, config.hbarAmount)
    .freezeWith(client);
  const signTx = await transaction.sign(config.refillerPrivateKey);
  const txResponse = await signTx.execute(client);
  const receipt = await txResponse.getReceipt(client);

  //Obtain the transaction consensus status
  const transactionStatus = receipt.status;

  console.log('The transaction consensus status ' + transactionStatus.toString());
}

export async function getConfig(): Promise<ConfigurationType> {
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
    hbarAmount: +process.env.REFILL_AMOUNT,
  };
}

export function getClient(config: ConfigurationType) {
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

main().then(() => {
  console.log('Refill executed!');
  process.exit(0);
});
