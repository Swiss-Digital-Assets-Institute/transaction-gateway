import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Client, Transaction } from '@hashgraph/sdk';
import { mockDeep } from 'jest-mock-extended';
import { HttpException, HttpStatus } from '@nestjs/common';
import { VaultManagerService } from '../vault-manager/vault-manager.service';
import { MockType, vaultManagerMockFactory } from '../../test/test.mocker';
import { HashgraphService } from './hashgraph.service';

jest.mock('@hashgraph/sdk');
jest.mock('axios');

// const moduleMocker = new ModuleMocker(global);

describe('HashgraphService', () => {
  let service: HashgraphService;
  let vaultManagerService: MockType<VaultManagerService>;
  let module: TestingModule;
  const client = mockDeep<Client>();
  const configServiceMock = {
    get: (key: string) => {
      if (key === 'HASHGRAPH_MIRROR_NODE_URL') return '';
      return {};
    },
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [],
      providers: [
        HashgraphService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        { provide: Client, useValue: client },
        { provide: VaultManagerService, useFactory: vaultManagerMockFactory },
      ],
    })
      .useMocker(() => {
        return {};
      })
      .compile();

    service = module.get<HashgraphService>(HashgraphService);
    vaultManagerService = module.get(VaultManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('onApplicationBootstrap hook should fetch secrets', async () => {
    service.fetchSecrets = jest.fn();
    const app = module.createNestApplication();
    await app.init();
    await app.close();
    expect(service.fetchSecrets).toHaveBeenCalled();
  });

  it('executeTransaction method should sign passed Transaction and execute it', async () => {
    const receiptMock = { receiptData: 'receiptData' };
    const getReceiptStub = jest.fn(() => {
      return receiptMock;
    });
    const executerResultMock = {
      getReceipt: getReceiptStub,
    };
    const executeStub = jest.fn(() => {
      return executerResultMock;
    });
    const transactionMock = {
      getReceipt: getReceiptStub,
      execute: executeStub,
    } as unknown as Transaction;
    const txStringMock = 'txMock';
    const expectedResult = { transactionReceipt: receiptMock, transactionResponse: executerResultMock };

    const txFromBytesStub = jest.spyOn(Transaction, 'fromBytes').mockReturnValue(transactionMock);
    service.transformTransactionResult = jest.fn().mockReturnValue(expectedResult);

    const receipt = await service.executeTransaction(txStringMock);
    expect(executeStub).toHaveBeenCalledWith(client);
    expect(getReceiptStub).toHaveBeenCalledWith(client);
    expect(txFromBytesStub).toHaveBeenCalledWith(Buffer.from(txStringMock, 'base64'));
    expect(receipt).toStrictEqual(expectedResult);
  });

  it('executeTransaction method should have retry logic implemented for BUSY errors', async () => {
    const receiptMock = { receiptData: 'receiptData' };
    let retries = 0;
    const expectedRetries = 3;
    const getReceiptStub = jest.fn(() => {
      return receiptMock;
    });
    const executeResultMock = {
      getReceipt: getReceiptStub,
    };
    const executeStub = jest.fn(() => {
      if (retries < expectedRetries) {
        retries++;
        throw new Error('BUSY');
      }

      return executeResultMock;
    });
    const transactionMock = {
      getReceipt: getReceiptStub,
      execute: executeStub,
    } as unknown as Transaction;
    const txStringMock = 'txMock';
    const expectedResult = { transactionReceipt: receiptMock, transactionResponse: executeResultMock };

    const txFromBytesStub = jest.spyOn(Transaction, 'fromBytes').mockReturnValue(transactionMock);
    service.transformTransactionResult = jest.fn().mockReturnValue(expectedResult);

    await service.executeTransaction(txStringMock);
    expect(txFromBytesStub).toHaveBeenCalledWith(Buffer.from(txStringMock, 'base64'));
    expect(retries).toBe(expectedRetries);
  });

  it('executeTransaction method should fail when max retries number reached', async () => {
    let retries = 0;
    const receiptMock = { receiptData: 'receiptData' };
    const expectedError = new HttpException(
      //@ts-expect-error ignore private access to property of a class
      `Transaction failed after ${service.MAX_RETRIES} attempts.`,
      HttpStatus.REQUEST_TIMEOUT,
    );
    const executeStub = jest.fn(() => {
      retries++;
      throw new Error('BUSY');
    });
    const getReceiptStub = jest.fn(() => {
      return receiptMock;
    });
    let error;
    const transactionMock = {
      getReceipt: getReceiptStub,
      execute: executeStub,
    } as unknown as Transaction;
    const txStringMock = 'txMock';

    jest.spyOn(Transaction, 'fromBytes').mockReturnValue(transactionMock);

    try {
      await service.executeTransaction(txStringMock);
    } catch (err) {
      error = err;
    }
    //@ts-expect-error ignore private access to property of a class
    expect(retries).toBe(service.MAX_RETRIES);
    expect(error).toStrictEqual(expectedError);
  });

  it('executeTransaction method should throw when unexpected errors happen', async () => {
    const receiptMock = { receiptData: 'receiptData' };
    const errorMock = new Error();
    const expectedError = new HttpException('Unexpected error occurred.', HttpStatus.INTERNAL_SERVER_ERROR, {
      cause: errorMock,
    });
    const executeStub = jest.fn(() => {
      throw errorMock;
    });
    const getReceiptStub = jest.fn(() => {
      return receiptMock;
    });
    const txStringMock = 'txMock';
    const transactionMock = {
      getReceipt: getReceiptStub,
      execute: executeStub,
    } as unknown as Transaction;
    jest.spyOn(Transaction, 'fromBytes').mockReturnValue(transactionMock);

    let error;
    try {
      await service.executeTransaction(txStringMock);
    } catch (err) {
      error = err;
    }
    expect(error).toStrictEqual(expectedError);
  });

  it('getOperatorAccountId should return operator account id string', async () => {
    const accIdMock = 'accIdMock';
    // @ts-expect-error ignore types
    service.accountId = { toString: () => accIdMock };

    const response = await service.getOperatorAccountId();
    expect(response).toStrictEqual({ accountId: accIdMock });
  });

  it('fetchSecrets should get secrets from vault and update service props', async () => {
    const accountIdMock = 'accountIdMock';
    const publicKeyMock = 'publicKeyMock';
    const privateKeyMock = 'privateKeyMock';
    const secretAccountInfoDataMock = {
      accountId: accountIdMock,
      publicKey: publicKeyMock,
      privateKey: privateKeyMock,
    };
    const clientMock = {
      setOperator: jest.fn().mockReturnValue(this),
    };

    vaultManagerService.getAccountInfoSecret.mockReturnValueOnce(secretAccountInfoDataMock);
    // @ts-expect-error ignore private props
    service.client = clientMock;
    await service.fetchSecrets();
    expect(vaultManagerService.getAccountInfoSecret).toHaveBeenCalled();
    expect(clientMock.setOperator).toHaveBeenCalledWith(accountIdMock, privateKeyMock);
  });

  it('transformTransactionResult should transform tx result', async () => {
    const txReceiptMock = {
      accountId: 'accountIdMock',
      status: { _code: 123 },
      fileId: 'fileIdMock',
      contractId: 'contractIdMock',
      topicId: 'topicIdMock',
      tokenId: 'tokenIdMock',
      scheduleId: 'scheduleIdMock',
      exchangeRate: 'exchangeRateMock',
      topicSequenceNumber: 'topicSequenceNumberMock',
      topicRunningHash: 'topicRunningHashMock',
      totalSupply: 'totalSupplyMock',
      scheduledTransactionId: 'scheduledTransactionIdMock',
      serials: 'serialsMock',
      duplicates: 'duplicatesMock',
      children: 'childrenMock',
    };
    const txResponseJSONMock = {
      nodeId: 'nodeId',
      transactionHash: 'transactionHash',
      transactionId: 'transactionId',
    };
    const txResponseMock = {
      toJSON: () => {
        return txResponseJSONMock;
      },
    };
    // @ts-expect-error ignore types
    const result = service.transformTransactionResult(txReceiptMock, txResponseMock);
    expect(result).toStrictEqual({
      transactionReceipt: { ...txReceiptMock, status: 123 },
      transactionResponse: txResponseJSONMock,
    });
  });
});
