import Vault from 'hashi-vault-js';
import { executorWalletSecretKey, refillerWalletSecretKey } from './constants';

import { VaultConfig } from './definitions';

export async function getConfig(): Promise<Promise<VaultConfig>> {
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

export function checkKey(key: string): void {
  if (![executorWalletSecretKey, refillerWalletSecretKey].includes(key))
    throw new Error(`Secret key "${key}" is not allowed.`);
}
