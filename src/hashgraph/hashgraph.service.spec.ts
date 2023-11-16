import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Client, Transaction } from '@hashgraph/sdk';
import { mockDeep } from 'jest-mock-extended';
import { HttpException, HttpStatus } from '@nestjs/common';
import { HashgraphService } from './hashgraph.service';

jest.mock('@hashgraph/sdk');
jest.mock('axios');

// const moduleMocker = new ModuleMocker(global);

describe('HashgraphService', () => {
  let service: HashgraphService;
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
      ],
    })
      .useMocker(() => {
        return {};
      })
      .compile();

    service = module.get<HashgraphService>(HashgraphService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

    const txFromBytesStub = jest.spyOn(Transaction, 'fromBytes').mockReturnValue(transactionMock);

    const receipt = await service.executeTransaction(txStringMock);
    expect(executeStub).toHaveBeenCalledWith(client);
    expect(getReceiptStub).toHaveBeenCalledWith(client);
    expect(txFromBytesStub).toHaveBeenCalledWith(Buffer.from(txStringMock, 'base64'));
    expect(receipt).toStrictEqual({ transactionReceipt: receiptMock, transactionResponse: executerResultMock });
  });

  it('executeTransaction method should have retry logic implemented for BUSY errors', async () => {
    const receiptMock = { receiptData: 'receiptData' };
    let retries = 0;
    const expectedRetries = 3;
    const getReceiptStub = jest.fn(() => {
      return receiptMock;
    });
    const executeStub = jest.fn(() => {
      if (retries < expectedRetries) {
        retries++;
        throw new Error('BUSY');
      }
      return {
        getReceipt: getReceiptStub,
      };
    });
    const transactionMock = {
      getReceipt: getReceiptStub,
      execute: executeStub,
    } as unknown as Transaction;
    const txStringMock = 'txMock';

    const txFromBytesStub = jest.spyOn(Transaction, 'fromBytes').mockReturnValue(transactionMock);

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
});
