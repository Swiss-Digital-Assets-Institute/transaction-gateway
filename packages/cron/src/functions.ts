import { AccountBalanceQuery, AccountId, Client, Hbar, PrivateKey } from '@hashgraph/sdk';
import Vault from 'hashi-vault-js';
import { BigNumber } from '@hashgraph/sdk/lib/Transfer'; // eslint-disable-line import/no-unresolved
import { executorWalletSecretKey, refillerWalletSecretKey } from './constants';
import { ConfigurationType, SecretAccountInfoData } from './definitions';

const mount = '/secret';

export async function getRefillAmount(config: ConfigurationType, client: Client): Promise<BigNumber> {
  const balance = await new AccountBalanceQuery().setAccountId(config.executorAccountId).execute(client);
  let refillAmount = new Hbar(0).toBigNumber();
  const hbarBalanceBN = balance.hbars.toBigNumber();
  const balanceThresholdBN = new Hbar(config.balanceThreshold).toBigNumber();
  const balanceTargetBN = new Hbar(config.balanceTarget).toBigNumber();

  if (hbarBalanceBN.comparedTo(balanceThresholdBN) <= 0) refillAmount = balanceTargetBN.minus(hbarBalanceBN);
  return refillAmount;
}

export async function getConfig(): Promise<ConfigurationType> {
  const vault = new Vault({
    https: true,
    baseUrl: process.env.VAULT_API_URL,
    timeout: 5000,
    proxy: false,
  });
  const response = await vault.healthCheck({});
  if (!response.initialized) throw new Error("Vault healthcheck hasn't passed.");
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

export function validateEnv() {
  const envArray = [
    process.env.VAULT_API_URL,
    process.env.VAULT_APP_ROLE_ID,
    process.env.VAULT_APP_ROLE_SECRET_ID,
    process.env.HASHGRAPH_NETWORK,
    process.env.BALANCE_THRESHOLD,
    process.env.BALANCE_TARGET,
  ];

  if (envArray.some((value) => value)) throw new Error('Some of the env params are not specified. Aborting.');
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
