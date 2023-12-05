import Vault from 'hashi-vault-js';

export type SetWalletCliParams = {
  accountId: string;
  publicKey: string;
  privateKey: string;
  secretKey: string;
};

export type SecretAccountInfoData = {
  accountId: string;
  publicKey: string;
  privateKey: string;
};

export type VaultConfig = {
  vault: Vault;
  token: string;
};
