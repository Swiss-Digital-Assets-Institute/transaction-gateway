import { TransferTransaction } from '@hashgraph/sdk';
import * as Functions from './functions';
import { main } from './main';

jest.mock('./functions');
jest.mock('@hashgraph/sdk');

describe('Main function', () => {
  const configMock = {
    refillerAccountId: '1',
    executorAccountId: '2',
    refillerPrivateKey: 'privKeyMock',
  };
  it('should verify the need and trigger transfer transaction from refiller to executors wallet', async () => {
    const clientMock = 'clientMock';
    const refillAmountMock = 123;

    // @ts-expect-error config mock
    const getConfigSpy = jest.spyOn(Functions, 'getConfig').mockResolvedValue(configMock);
    const validateEnvSpy = jest.spyOn(Functions, 'validateEnv').mockReturnValue();
    // @ts-expect-error config mock
    const getClientSpy = jest.spyOn(Functions, 'getClient').mockReturnValue(clientMock);
    // @ts-expect-error config mock
    const getRefillAmountSpy = jest.spyOn(Functions, 'getRefillAmount').mockReturnValue(refillAmountMock);

    const getReceiptMock = {
      status: 'DONE',
    };
    const getReceiptStub = jest.fn().mockResolvedValue(getReceiptMock);
    const executeStub = jest.fn().mockResolvedValue({ getReceipt: getReceiptStub });
    const signStub = jest.fn().mockResolvedValue({ execute: executeStub });
    const freezeWithStub = jest.fn().mockReturnValue({ sign: signStub });

    const addHbarTransferStub1 = jest.fn().mockReturnValue({ freezeWith: freezeWithStub });
    // @ts-expect-error ignore types
    const addHbarTransferStub2 = jest.spyOn(TransferTransaction.prototype, 'addHbarTransfer').mockReturnValueOnce({
      addHbarTransfer: addHbarTransferStub1,
    });

    await main();

    expect(addHbarTransferStub1).toHaveBeenCalledWith(configMock.executorAccountId, refillAmountMock);
    expect(addHbarTransferStub2).toHaveBeenCalledWith(configMock.refillerAccountId, -refillAmountMock);
    expect(freezeWithStub).toHaveBeenCalledWith(clientMock);
    expect(signStub).toHaveBeenCalledWith(configMock.refillerPrivateKey);
    expect(executeStub).toHaveBeenCalledWith(clientMock);
    expect(getReceiptStub).toHaveBeenCalledWith(clientMock);
    expect(validateEnvSpy).toHaveBeenCalled();
    expect(getConfigSpy).toHaveBeenCalled();
    expect(getClientSpy).toHaveBeenCalledWith(configMock);
    expect(getRefillAmountSpy).toHaveBeenCalledWith(configMock, clientMock);
  });

  it('should verify the need and finish without transfer', async () => {
    const clientMock = 'clientMock';
    const refillAmountMock = 0;

    // @ts-expect-error config mock
    const getConfigSpy = jest.spyOn(Functions, 'getConfig').mockResolvedValue(configMock);
    const validateEnvSpy = jest.spyOn(Functions, 'validateEnv').mockReturnValue();
    // @ts-expect-error config mock
    const getClientSpy = jest.spyOn(Functions, 'getClient').mockReturnValue(clientMock);
    // @ts-expect-error config mock
    const getRefillAmountSpy = jest.spyOn(Functions, 'getRefillAmount').mockReturnValue(refillAmountMock);

    const getReceiptMock = {
      status: 'DONE',
    };
    const getReceiptStub = jest.fn().mockResolvedValue(getReceiptMock);
    const executeStub = jest.fn().mockResolvedValue({ getReceipt: getReceiptStub });
    const signStub = jest.fn().mockResolvedValue({ execute: executeStub });
    const freezeWithStub = jest.fn().mockReturnValue({ sign: signStub });

    const addHbarTransferStub1 = jest.fn().mockReturnValue({ freezeWith: freezeWithStub });
    // @ts-expect-error ignore types
    const addHbarTransferStub2 = jest.spyOn(TransferTransaction.prototype, 'addHbarTransfer').mockReturnValueOnce({
      addHbarTransfer: addHbarTransferStub1,
    });

    await main();

    expect(validateEnvSpy).toHaveBeenCalled();
    expect(getConfigSpy).toHaveBeenCalled();
    expect(getClientSpy).toHaveBeenCalledWith(configMock);
    expect(getRefillAmountSpy).toHaveBeenCalledWith(configMock, clientMock);

    expect(addHbarTransferStub1).toHaveBeenCalledTimes(0);
    expect(addHbarTransferStub2).toHaveBeenCalledTimes(0);
    expect(freezeWithStub).toHaveBeenCalledTimes(0);
    expect(signStub).toHaveBeenCalledTimes(0);
    expect(executeStub).toHaveBeenCalledTimes(0);
    expect(getReceiptStub).toHaveBeenCalledTimes(0);
  });
});
