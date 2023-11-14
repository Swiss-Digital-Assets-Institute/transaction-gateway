import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import Vault from 'hashi-vault-js';
import { ConfigService } from '@nestjs/config';
import { AccountId, PrivateKey, PublicKey } from '@hashgraph/sdk';
import { AccountInfoData } from '../hashgraph/definitions';
import { SecretAccountInfoData, SecretItem, SecretItemData } from './definitions';

@Injectable()
export class VaultManagerService implements OnModuleInit {
  private readonly logger = new Logger(VaultManagerService.name);
  private token: string;
  // This secrets should be used by admin server(current functionality is only for dev usage) to be able to supply client token. For more info: https://developer.hashicorp.com/vault/tutorials/auth-methods/approle
  private adminToken: string;
  private appRoleId: string;
  private secretId: string;
  private appRole: string;
  // This secrets should be used by admin server(current functionality is only for dev usage) to be able to supply client token. For more info: https://developer.hashicorp.com/vault/tutorials/auth-methods/approle
  constructor(private readonly vault: Vault, private readonly configService: ConfigService) {}

  async onModuleInit() {
    // TODO: remove this lines for production ready environment
    this.appRoleId = this.configService.getOrThrow<string>('VAULT_APP_ROLE_ID');
    this.appRole = this.configService.getOrThrow<string>('VAULT_APP_ROLE');
    this.adminToken = this.configService.getOrThrow<string>('VAULT_ROOT_TOKEN');
    await this.adminAuth();
    // TODO: remove this lines for production ready environment
    await this.auth();
    const response = await this.vault.healthCheck({});
    if (!response.initialized) throw new Error("Vault healthcheck hasn't passed.");
  }

  // Function is created to simulate admin server behavior, in prod this should be set up as a separate service
  async adminAuth() {
    const secretIdResponse = await this.vault.generateAppRoleSecretId(this.adminToken, this.appRole);
    this.secretId = secretIdResponse.secret_id;
  }

  async auth() {
    const loginResponse = await this.vault.loginWithAppRole(this.appRoleId, this.secretId);
    this.token = loginResponse.client_token;
  }

  async createSecret<T extends SecretItemData>(key: string, value: T) {
    const item: SecretItem<T> = {
      name: key,
      data: { ...value },
    };
    await this.vault.createKVSecret(this.token, item.name, item.data);
  }

  async eliminateSecret(key: string) {
    await this.vault.eliminateKVSecret(this.token, key);
  }

  async getSecretValue<T extends SecretItemData>(key: string): Promise<T> {
    return (await this.vault.readKVSecret(this.token, key)).data;
  }

  async getAccountInfoSecret(departmentId: number): Promise<AccountInfoData> {
    const secret = await this.getSecretValue<SecretAccountInfoData>(departmentId.toString());
    return {
      accountId: AccountId.fromString(secret.accountId),
      publicKey: PublicKey.fromStringED25519(secret.publicKey),
      privateKey: PrivateKey.fromStringED25519(secret.privateKey),
    };
  }
}
