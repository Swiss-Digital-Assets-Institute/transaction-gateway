import { AccountId, PrivateKey, PublicKey } from '@hashgraph/sdk';
import { checkKey, getConfig } from './functions';
import { SetWalletCliParams } from './definitions';

const mount = '/secret';

// Asynchronous function for setting up a wallet
export async function setWallet(params: SetWalletCliParams): Promise<void> {
  // Destructure options object to extract accountId, publicKey, privateKey, and secretKey
  const { accountId, publicKey, privateKey, secretKey } = params;

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
