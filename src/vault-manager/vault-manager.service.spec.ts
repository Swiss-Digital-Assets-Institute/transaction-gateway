import { Test, TestingModule } from '@nestjs/testing';
import Vault from 'hashi-vault-js';
import { ConfigService } from '@nestjs/config';
import { PrivateKey, PublicKey } from '@hashgraph/sdk';
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
    const adminAuthSpy = jest.spyOn(service, 'adminAuth').mockImplementation(async () => {
      return;
    });
    const authSpy = jest.spyOn(service, 'auth').mockImplementation(async () => {
      return;
    });
    vaultMock.healthCheck.mockReturnValue({ initialized: true });
    await module.init();
    expect(onModuleInitSpy).toHaveBeenCalled();
    expect(adminAuthSpy).toHaveBeenCalled();
    expect(authSpy).toHaveBeenCalled();
    expect(vaultMock.healthCheck).toHaveBeenCalled();
  });

  it('onModuleInit should fail because of failed healthcheck', async () => {
    const onModuleInitSpy = jest.spyOn(service, 'onModuleInit');
    const adminAuthSpy = jest.spyOn(service, 'adminAuth').mockImplementation(async () => {
      return;
    });
    const authSpy = jest.spyOn(service, 'auth').mockImplementation(async () => {
      return;
    });
    vaultMock.healthCheck.mockReturnValue({ initialized: false });
    let error;
    try {
      await module.init();
    } catch (err) {
      error = err;
    }
    expect(onModuleInitSpy).toHaveBeenCalled();
    expect(adminAuthSpy).toHaveBeenCalled();
    expect(authSpy).toHaveBeenCalled();
    expect(vaultMock.healthCheck).toHaveBeenCalled();
    expect(error).toStrictEqual(new Error("Vault healthcheck hasn't passed."));
  });

  it('adminAuth method should generate app role secret id', async () => {
    vaultMock.generateAppRoleSecretId.mockReturnValue({ secret_id: '123' });
    await service.adminAuth();
    expect(vaultMock.generateAppRoleSecretId).toHaveBeenCalledWith(undefined, undefined);
  });

  it('auth method should login with app role', async () => {
    vaultMock.loginWithAppRole.mockReturnValue({ client_token: '123abc' });
    await service.auth();
    expect(vaultMock.loginWithAppRole).toHaveBeenCalledWith(undefined, undefined);
  });

  it('createSecret method should call create secret in vault', async () => {
    const keyMock = 'key';
    const valueMock = { id: '111', publicKey: 'abcdef-12345', privateKey: 'ghijklm-67890' };
    await service.createSecret(keyMock, valueMock);
    expect(vaultMock.createKVSecret).toHaveBeenCalledWith(undefined, 'key', {
      id: '111',
      publicKey: 'abcdef-12345',
      privateKey: 'ghijklm-67890',
    });
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
    expect(vaultMock.readKVSecret).toHaveBeenCalledWith(undefined, keyMock);
  });

  // it('getDepartmentKeyPairSecret should call getSecret method and create instances of returned key pair ', async () => {
  //   const stringKeyPairMock = {
  //     publicKey: '123',
  //     privateKey: '234',
  //   };
  //   const pubKeyMock = 'pubKeyMock';
  //   const privKeyMock = 'privKeyMock';
  //   const departmentIdMock = 1;
  //   const getSecretValueSpy = jest.spyOn(service, 'getSecretValue').mockResolvedValue(stringKeyPairMock);
  //   //@ts-expect-error ignoring typings
  //   const publicKeySpy = jest.spyOn(PublicKey, 'fromStringED25519').mockReturnValue(pubKeyMock);
  //   //@ts-expect-error ignoring typings
  //   const privateKeySpy = jest.spyOn(PrivateKey, 'fromStringED25519').mockReturnValue(privKeyMock);

  //   const result = await service.getDepartmentKeyPairSecret(departmentIdMock);

  //   expect(result).toStrictEqual({
  //     publicKey: pubKeyMock,
  //     privateKey: privKeyMock,
  //   });
  //   expect(getSecretValueSpy).toHaveBeenCalledWith(departmentIdMock.toString());
  //   expect(publicKeySpy).toHaveBeenCalledWith(stringKeyPairMock.publicKey);
  //   expect(privateKeySpy).toHaveBeenCalledWith(stringKeyPairMock.privateKey);
  // });
});
