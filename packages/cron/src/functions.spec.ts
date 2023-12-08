import { AccountBalanceQuery, AccountId, Client, Hbar, PrivateKey } from '@hashgraph/sdk';
import Vault from 'hashi-vault-js';
import { getClient, getConfig, getRefillAmount, validateEnv } from './functions';
jest.mock('hashi-vault-js', () => jest.fn());

describe('Functions', () => {
  it('getRefillAmount should calculate refill amount', async () => {
    const clientMock = 'clientMock';
    const balanceMock = {
      hbars: new Hbar(450),
    };
    const configMock = {
      executorAccountId: '2',
      balanceThreshold: 500,
      balanceTarget: 1000,
    };
    const executeStub = jest.fn().mockResolvedValue(balanceMock);
    // @ts-expect-error ignore types
    jest.spyOn(AccountBalanceQuery.prototype, 'setAccountId').mockReturnValue({ execute: executeStub });
    // @ts-expect-error ignore types
    const refillAmount = await getRefillAmount(configMock, clientMock);
    const expectedRefillAmount = new Hbar(configMock.balanceTarget)
      .toBigNumber()
      .minus(balanceMock.hbars.toBigNumber());
    expect(refillAmount.toString()).toBe(expectedRefillAmount.toString());
  });

  it('getConfig should create Vault instance and login with app role ', async () => {
    const clientTokenMock = 'clientTokenMock';
    const VAULT_API_URL_MOCK = 'VAULT_API_URL_MOCK';
    const VAULT_APP_ROLE_ID_MOCK = 'VAULT_APP_ROLE_ID_MOCK';
    const VAULT_APP_ROLE_SECRET_ID_MOCK = 'VAULT_APP_ROLE_SECRET_ID_MOCK';
    const BALANCE_THRESHOLD_MOCK = '500';
    const BALANCE_TARGET_MOCK = '100';
    const HASHGRAPH_NETWORK_MOCK = 'HASHGRAPH_NETWORK_MOCK';
    const accountIdFromStringMock = 'accountIdFromStringMock';
    const privateKeyFromStringMock = 'privateKeyFromStringMock';
    const readKVSecretMock = { accountId: 'accountIdMock', privateKey: 'privateKeyMock' };
    const healthCheckStub = jest.fn().mockResolvedValue({
      initialized: true,
    });
    const loginWithAppRoleStub = jest.fn().mockResolvedValue({
      client_token: clientTokenMock,
    });
    const readKVSecretStub = jest.fn().mockResolvedValue({
      data: readKVSecretMock,
    });
    const vaultMock = {
      healthCheck: healthCheckStub,
      loginWithAppRole: loginWithAppRoleStub,
      readKVSecret: readKVSecretStub,
    };
    // @ts-expect-error ignore types
    jest.spyOn(AccountId, 'fromString').mockReturnValue(accountIdFromStringMock);
    // @ts-expect-error ignore types
    jest.spyOn(PrivateKey, 'fromStringED25519').mockReturnValue(privateKeyFromStringMock);
    // @ts-expect-error ignore types
    Vault.mockReturnValue(vaultMock);
    process.env.VAULT_API_URL = VAULT_API_URL_MOCK;
    process.env.VAULT_APP_ROLE_ID = VAULT_APP_ROLE_ID_MOCK;
    process.env.VAULT_APP_ROLE_SECRET_ID = VAULT_APP_ROLE_SECRET_ID_MOCK;
    process.env.BALANCE_THRESHOLD = BALANCE_THRESHOLD_MOCK;
    process.env.BALANCE_TARGET = BALANCE_TARGET_MOCK;
    process.env.HASHGRAPH_NETWORK = HASHGRAPH_NETWORK_MOCK;

    const config = await getConfig();

    expect(healthCheckStub).toHaveBeenCalledWith({});
    expect(loginWithAppRoleStub).toHaveBeenCalledWith(VAULT_APP_ROLE_ID_MOCK, VAULT_APP_ROLE_SECRET_ID_MOCK);
    expect(Vault).toHaveBeenCalledWith({
      https: true,
      baseUrl: VAULT_API_URL_MOCK,
      timeout: 5000,
      proxy: false,
    });
    expect(config).toStrictEqual({
      hashgraphNetwork: HASHGRAPH_NETWORK_MOCK,
      executorAccountId: AccountId.fromString(readKVSecretMock.accountId),
      refillerAccountId: AccountId.fromString(readKVSecretMock.accountId),
      refillerPrivateKey: PrivateKey.fromStringED25519(readKVSecretMock.privateKey),
      balanceThreshold: +BALANCE_THRESHOLD_MOCK,
      balanceTarget: +BALANCE_TARGET_MOCK,
    });
    process.env.VAULT_API_URL = undefined;
    process.env.VAULT_APP_ROLE_ID = undefined;
    process.env.VAULT_APP_ROLE_SECRET_ID = undefined;
    process.env.BALANCE_THRESHOLD = undefined;
    process.env.BALANCE_TARGET = undefined;
    process.env.HASHGRAPH_NETWORK = undefined;
  });

  it("getConfig should fail because vault healthcheck hasn't passed", async () => {
    const healthCheckStub = jest.fn().mockResolvedValue({
      initialized: false,
    });
    const vaultMock = {
      healthCheck: healthCheckStub,
    };
    // @ts-expect-error ignore types
    Vault.mockReturnValue(vaultMock);
    let error: Error;
    try {
      await getConfig();
    } catch (err) {
      error = err;
    }
    expect(error).toStrictEqual(new Error("Vault healthcheck hasn't passed."));
  });

  it('validateEnv should fail because of undefined env variables', async () => {
    let error: Error;
    try {
      validateEnv();
    } catch (err) {
      error = err;
    }
    expect(error).toStrictEqual(new Error('Some of the env params are not specified. Aborting.'));
  });

  it('getClient function should choose correct client in dependency to network', async () => {
    const configMock = {
      hashgraphNetwork: 'mainnet',
      refillerAccountId: '2',
      refillerPrivateKey: 'refillerPrivateKeyMock',
    };
    const setOperatorSpy = jest.fn();
    const clientMock = {
      setOperator: setOperatorSpy,
    };
    // @ts-expect-error ignore types
    jest.spyOn(Client, 'forMainnet').mockReturnValue(clientMock);
    // @ts-expect-error ignore types
    let client = getClient(configMock);
    expect(client).toBe(clientMock);
    expect(setOperatorSpy).toHaveBeenCalledWith(configMock.refillerAccountId, configMock.refillerPrivateKey);

    configMock.hashgraphNetwork = 'testnet';
    // @ts-expect-error ignore types
    jest.spyOn(Client, 'forTestnet').mockReturnValue(clientMock);
    // @ts-expect-error ignore types
    client = getClient(configMock);
    expect(client).toBe(clientMock);
    expect(setOperatorSpy).toHaveBeenCalledWith(configMock.refillerAccountId, configMock.refillerPrivateKey);

    configMock.hashgraphNetwork = 'preview';
    // @ts-expect-error ignore types
    jest.spyOn(Client, 'forPreviewnet').mockReturnValue(clientMock);
    // @ts-expect-error ignore types
    client = getClient(configMock);
    expect(client).toBe(clientMock);
    expect(setOperatorSpy).toHaveBeenCalledWith(configMock.refillerAccountId, configMock.refillerPrivateKey);

    configMock.hashgraphNetwork = 'random';
    // @ts-expect-error ignore types
    jest.spyOn(Client, 'forTestnet').mockReturnValue(clientMock);
    // @ts-expect-error ignore types
    client = getClient(configMock);
    expect(client).toBe(clientMock);
    expect(setOperatorSpy).toHaveBeenCalledWith(configMock.refillerAccountId, configMock.refillerPrivateKey);
  });
});
