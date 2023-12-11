import { Test, TestingModule } from '@nestjs/testing';
import Vault from 'hashi-vault-js';
import { ConfigService } from '@nestjs/config';
import { AccountId, PrivateKey, PublicKey } from '@hashgraph/sdk';
import { executorWalletSecretKey } from '../constants';
import { VaultManagerService } from './vault-manager.service';
jest.mock('@hashgraph/sdk');

describe('VaultManagerService', () => {
  let service: VaultManagerService;
  let module: TestingModule;

  const configServiceMock = {
    getOrThrow: jest.fn(),
  };
  const vaultMock = {
    healthCheck: jest.fn(),
    generateAppRoleSecretId: jest.fn(),
    loginWithAppRole: jest.fn(),
    createKVSecret: jest.fn(),
    eliminateKVSecret: jest.fn(),
    readKVSecret: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        { provide: Vault, useValue: vaultMock },
        VaultManagerService,
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<VaultManagerService>(VaultManagerService);
  });

  afterEach(() => {
    vaultMock.generateAppRoleSecretId = jest.fn();
    vaultMock.healthCheck = jest.fn();
    vaultMock.loginWithAppRole = jest.fn();
    vaultMock.createKVSecret = jest.fn();
    vaultMock.eliminateKVSecret = jest.fn();
    vaultMock.readKVSecret = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('onModuleInit should call authenticate app against vault', async () => {
    const onModuleInitSpy = jest.spyOn(service, 'onModuleInit');
    const authSpy = jest.spyOn(service, 'auth').mockImplementation(async () => {
      return;
    });
    vaultMock.healthCheck.mockReturnValue({ initialized: true });
    await module.init();
    expect(onModuleInitSpy).toHaveBeenCalled();
    expect(authSpy).toHaveBeenCalled();
    expect(vaultMock.healthCheck).toHaveBeenCalled();
  });

  it('onModuleInit should fail because of failed healthcheck', async () => {
    const onModuleInitSpy = jest.spyOn(service, 'onModuleInit');
    vaultMock.healthCheck.mockReturnValue({ initialized: false });
    let error;
    try {
      await module.init();
    } catch (err) {
      error = err;
    }
    expect(onModuleInitSpy).toHaveBeenCalled();
    expect(vaultMock.healthCheck).toHaveBeenCalled();
    expect(error).toStrictEqual(new Error("Vault healthcheck hasn't passed."));
  });

  it('auth method should login with app role', async () => {
    vaultMock.loginWithAppRole.mockReturnValue({ client_token: '123abc' });
    await service.auth();
    expect(vaultMock.loginWithAppRole).toHaveBeenCalledWith(undefined, undefined);
  });

  it('createSecret method should call create secret in vault', async () => {
    const keyMock = 'key';
    const valueMock = { accountId: '111', publicKey: 'abcdef-12345', privateKey: 'ghijklm-67890' };
    await service.createSecret(keyMock, valueMock);
    expect(vaultMock.createKVSecret).toHaveBeenCalledWith(undefined, 'key', valueMock);
  });

  it('eliminateSecret method should call eliminate secret in vault', async () => {
    const keyMock = 'key';
    await service.eliminateSecret(keyMock);
    expect(vaultMock.eliminateKVSecret).toHaveBeenCalledWith(undefined, keyMock);
  });

  it('getSecretValue method should call readKVSecret in vault', async () => {
    const keyMock = 'key';
    const valueMock = 'value';
    vaultMock.readKVSecret.mockReturnValue({ data: { value: valueMock } });
    await service.getSecretValue(keyMock);
    expect(vaultMock.readKVSecret).toHaveBeenCalledWith(undefined, keyMock, 0, 'secret');
  });

  it('getDepartmentKeyPairSecret should call getSecret method and create instances of returned key pair ', async () => {
    const accountInfoSecretMock = {
      accountId: '0.0.1',
      publicKey: '123',
      privateKey: '234',
    };
    const accountIdMock = '1.0.0';
    const pubKeyMock = 'pubKeyMock';
    const privKeyMock = 'privKeyMock';
    const getSecretValueSpy = jest.spyOn(service, 'getSecretValue').mockResolvedValue(accountInfoSecretMock);
    //@ts-expect-error ignoring typings
    const accountIdSpy = jest.spyOn(AccountId, 'fromString').mockReturnValue(accountIdMock);
    //@ts-expect-error ignoring typings
    const publicKeySpy = jest.spyOn(PublicKey, 'fromStringED25519').mockReturnValue(pubKeyMock);
    //@ts-expect-error ignoring typings
    const privateKeySpy = jest.spyOn(PrivateKey, 'fromStringED25519').mockReturnValue(privKeyMock);

    const result = await service.getAccountInfoSecret();

    expect(result).toStrictEqual({
      accountId: accountIdMock,
      publicKey: pubKeyMock,
      privateKey: privKeyMock,
    });
    expect(getSecretValueSpy).toHaveBeenCalledWith(executorWalletSecretKey);
    expect(accountIdSpy).toHaveBeenCalledWith(accountInfoSecretMock.accountId);
    expect(publicKeySpy).toHaveBeenCalledWith(accountInfoSecretMock.publicKey);
    expect(privateKeySpy).toHaveBeenCalledWith(accountInfoSecretMock.privateKey);
  });
});
