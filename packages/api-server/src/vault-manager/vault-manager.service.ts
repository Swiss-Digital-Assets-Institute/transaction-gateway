import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import Vault from 'hashi-vault-js';
import { ConfigService } from '@nestjs/config';
import { AccountId, PrivateKey, PublicKey } from '@hashgraph/sdk';
import { AccountInfoData } from '../hashgraph/definitions';
import { executorWalletSecretKey } from '../constants';
import { SecretAccountInfoData, SecretItemData } from './definitions';

@Injectable()
export class VaultManagerService implements OnModuleInit {
  private readonly logger = new Logger(VaultManagerService.name);
  private readonly mount = 'secret';
  private token: string;
  private appRoleId: string;
  private secretId: string;
  constructor(private readonly vault: Vault, private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.appRoleId = this.configService.getOrThrow<string>('VAULT_APP_ROLE_ID');
    this.secretId = this.configService.getOrThrow<string>('VAULT_APP_ROLE_SECRET_ID');
    const response = await this.vault.healthCheck({});
    if (!response.initialized) throw new Error("Vault healthcheck hasn't passed.");

    await this.auth();
  }

  async auth() {
    const loginResponse = await this.vault.loginWithAppRole(this.appRoleId, this.secretId);
    this.token = loginResponse.client_token;
  }

  async createSecret<T extends SecretItemData>(key: string, value: T) {
    await this.vault.createKVSecret(this.token, key, value);
  }

  async eliminateSecret(key: string) {
    await this.vault.eliminateKVSecret(this.token, key);
  }

  async getSecretValue<T extends SecretItemData>(key: string): Promise<T> {
    return (await this.vault.readKVSecret(this.token, key, 0, this.mount)).data;
  }

  async getAccountInfoSecret(): Promise<AccountInfoData> {
    const secret = await this.getSecretValue<SecretAccountInfoData>(executorWalletSecretKey);
    return {
      accountId: AccountId.fromString(secret.accountId),
      publicKey: PublicKey.fromStringED25519(secret.publicKey),
      privateKey: PrivateKey.fromStringED25519(secret.privateKey),
    };
  }
}
