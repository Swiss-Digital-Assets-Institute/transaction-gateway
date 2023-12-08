import Vault from 'hashi-vault-js';
import { executorWalletSecretKey, refillerWalletSecretKey } from './constants';
import { checkKey, getConfig } from './functions';

jest.mock('hashi-vault-js', () => jest.fn());

describe('Functions', () => {
  it('getConfig should create Vault instance and login with app role ', async () => {
    const clientTokenMock = 'clientTokenMock';
    const VAULT_API_URL_MOCK = 'VAULT_API_URL_MOCK';
    const VAULT_APP_ROLE_ID_MOCK = 'VAULT_APP_ROLE_ID_MOCK';
    const VAULT_APP_ROLE_SECRET_ID_MOCK = 'VAULT_APP_ROLE_SECRET_ID_MOCK';
    const healthCheckStub = jest.fn().mockResolvedValue({
      initialized: true,
    });
    const loginWithAppRoleStub = jest.fn().mockResolvedValue({
      client_token: clientTokenMock,
    });
    const vaultMock = {
      healthCheck: healthCheckStub,
      loginWithAppRole: loginWithAppRoleStub,
    };
    // @ts-expect-error ignore types
    Vault.mockReturnValue(vaultMock);
    process.env.VAULT_API_URL = VAULT_API_URL_MOCK;
    process.env.VAULT_APP_ROLE_ID = VAULT_APP_ROLE_ID_MOCK;
    process.env.VAULT_APP_ROLE_SECRET_ID = VAULT_APP_ROLE_SECRET_ID_MOCK;
    const config = await getConfig();

    expect(healthCheckStub).toHaveBeenCalledWith({});
    expect(loginWithAppRoleStub).toHaveBeenCalledWith(VAULT_APP_ROLE_ID_MOCK, VAULT_APP_ROLE_SECRET_ID_MOCK);
    expect(Vault).toHaveBeenCalledWith({
      https: true,
      baseUrl: VAULT_API_URL_MOCK,
      timeout: 5000,
      proxy: false,
    });
    expect(config).toStrictEqual({ token: clientTokenMock, vault: vaultMock });
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

  it('checkKey should pass when correct value passed', async () => {
    checkKey(executorWalletSecretKey);
    checkKey(refillerWalletSecretKey);
  });

  it('checkKey should fail when wrong value passed', async () => {
    let error: Error;
    try {
      checkKey('123');
    } catch (err) {
      error = err;
    }
    expect(error).toStrictEqual(new Error(`Secret key "123" is not allowed.`));
  });
});
