import { AccountId, PrivateKey, PublicKey } from '@hashgraph/sdk';
import * as Functions from './functions';
import { setWallet } from './set-wallet';

jest.mock('@hashgraph/sdk');
jest.mock('./functions');

describe('Set Wallet flow', () => {
  it('setWallet function should verify input data and set wallet creds inside vault', async () => {
    const configMock = {
      vault: {
        eliminateKVSecret: jest.fn(),
        createKVSecret: jest.fn(),
      },
      token: 'tokenMock',
    };
    const mountMock = '/secret';
    const accountIdMock = 'accountIdMock';
    const publicKeyMock = 'publicKeyMock';
    const privateKeyMock = 'privateKeyMock';
    const secretKeyMock = 'secretKeyMock';
    const optionsMock = {
      accountId: accountIdMock,
      publicKey: publicKeyMock,
      privateKey: privateKeyMock,
      secretKey: secretKeyMock,
    };

    const accountIdSpy = jest.spyOn(AccountId, 'fromString').mockImplementation();
    const publicKeySpy = jest.spyOn(PublicKey, 'fromStringED25519').mockImplementation();
    const privateKeySpy = jest.spyOn(PrivateKey, 'fromStringED25519').mockImplementation();
    const checkKeySpy = jest.spyOn(Functions, 'checkKey').mockReturnValue(null);
    // @ts-expect-error ignore types
    const getConfigSpy = jest.spyOn(Functions, 'getConfig').mockResolvedValue(configMock);

    await setWallet(optionsMock);

    expect(accountIdSpy).toHaveBeenCalledWith(accountIdMock);
    expect(publicKeySpy).toHaveBeenCalledWith(publicKeyMock);
    expect(privateKeySpy).toHaveBeenCalledWith(privateKeyMock);
    expect(checkKeySpy).toHaveBeenCalled();
    expect(getConfigSpy).toHaveBeenCalled();
    expect(configMock.vault.eliminateKVSecret).toHaveBeenCalledWith(configMock.token, secretKeyMock, mountMock);
    expect(configMock.vault.createKVSecret).toHaveBeenCalledWith(
      configMock.token,
      secretKeyMock,
      {
        accountId: accountIdMock,
        publicKey: publicKeyMock,
        privateKey: privateKeyMock,
      },
      mountMock,
    );
  });
});
