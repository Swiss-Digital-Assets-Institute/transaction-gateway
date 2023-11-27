import commandLineArgs from 'command-line-args';
import Vault from 'hashi-vault-js';
import { config } from 'dotenv';
import { AccountId, PrivateKey, PublicKey } from '@hashgraph/sdk';
import { executorWalletSecretKey, refillerWalletSecretKey } from '../constants';
import { SetWalletCliParams, VaultConfig } from './definitions';
config();
const optionDefinitions = [
  { name: 'secretKey', type: String },
  { name: 'accountId', type: String },
  { name: 'publicKey', type: String },
  { name: 'privateKey', type: String },
];
const options: SetWalletCliParams = commandLineArgs(optionDefinitions);
const mount = '/secret';

// Asynchronous function for setting up a wallet
async function setWallet(): Promise<void> {
  // Destructure options object to extract accountId, publicKey, privateKey, and secretKey
  const { accountId, publicKey, privateKey, secretKey } = options;

  // Validate the account ID, public key, and private key
  AccountId.fromString(accountId);
  PublicKey.fromStringED25519(publicKey);
  PrivateKey.fromStringED25519(privateKey);
  checkKey(secretKey); // Custom function to check is the secretKey allowed

  // Asynchronously initialize the config
  const config = await getConfig();

  // Remove any existing secret with the secretKey
  await config.vault.eliminateKVSecret(config.token, secretKey, mount);

  // Create a new secret with the secretKey and specified account information

  await config.vault.createKVSecret(
    config.token,
    secretKey,
    {
      accountId,
      publicKey,
      privateKey,
    },
    mount,
  );
}

async function getConfig(): Promise<Promise<VaultConfig>> {
  // Create a new Vault instance with specified configuration
  const vault = new Vault({
    https: true,
    baseUrl: process.env.VAULT_API_URL, // Base URL from environment variable
    timeout: 5000, // Timeout for vault operations
    proxy: false, // Whether to use a proxy
  });
  const appRoleId = process.env.VAULT_APP_ROLE_ID;
  const secretId = process.env.VAULT_APP_ROLE_SECRET_ID;
  const response = await vault.healthCheck({});
  if (!response.initialized) throw new Error("Vault healthcheck hasn't passed.");
  const loginResponse = await vault.loginWithAppRole(appRoleId, secretId);
  const token = loginResponse.client_token;
  return { vault, token };
}

function checkKey(key: string): void {
  if (![executorWalletSecretKey, refillerWalletSecretKey].includes(key))
    throw new Error(`Secret key "${key}" is not allowed.`);
}

setWallet().then(() => {
  console.log('Success!');
  process.exit(0);
});
