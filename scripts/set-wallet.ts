import commandLineArgs from 'command-line-args';
import Vault from 'hashi-vault-js';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { AccountId, PrivateKey, PublicKey } from '@hashgraph/sdk';
import { VaultManagerService } from '../src/vault-manager/vault-manager.service';
import { executorWalletSecretKey, refillerWalletSecretKey } from '../src/constants';
import { SecretAccountInfoData } from '../src/vault-manager/definitions';
import { SetWalletCliParams } from './definitions';
config();
const optionDefinitions = [
  { name: 'secretKey', type: String },
  { name: 'accountId', type: String },
  { name: 'publicKey', type: String },
  { name: 'privateKey', type: String },
];
const options: SetWalletCliParams = commandLineArgs(optionDefinitions);
const configServiceMock = {
  get: (key: string) => process.env[key],
  getOrThrow: (key: string) => {
    const value = process.env[key];
    if (!value) throw new Error(`No env param with "${key}" key.`);
    return value;
  },
};

function checkKey(key: string): void {
  if (![executorWalletSecretKey, refillerWalletSecretKey].includes(key))
    throw new Error(`Secret key "${key}" is not allowed.`);
}

// Asynchronous function for setting up a wallet
async function setWallet(): Promise<void> {
  // Destructure options object to extract accountId, publicKey, privateKey, and secretKey
  const { accountId, publicKey, privateKey, secretKey } = options;

  // Validate the account ID, public key, and private key
  AccountId.fromString(accountId);
  PublicKey.fromStringED25519(publicKey);
  PrivateKey.fromStringED25519(privateKey);
  checkKey(secretKey); // Custom function to check is the secretKey allowed

  // Create a new Vault instance with specified configuration
  const vault = new Vault({
    https: true,
    baseUrl: process.env.VAULT_API_URL, // Base URL from environment variable
    timeout: 5000, // Timeout for vault operations
    proxy: false, // Whether to use a proxy
  });

  // Create a new VaultManagerService instance with the Vault and a mock ConfigService
  const vaultManager = new VaultManagerService(vault, configServiceMock as ConfigService);

  // Asynchronously initialize the vault manager
  await vaultManager.onModuleInit();

  // Remove any existing secret with the secretKey
  await vaultManager.eliminateSecret(secretKey);

  // Create a new secret with the secretKey and specified account information
  await vaultManager.createSecret<SecretAccountInfoData>(secretKey, {
    accountId,
    publicKey,
    privateKey,
  });
}

setWallet().then(() => {
  console.log('Success!');
  process.exit(0);
});
