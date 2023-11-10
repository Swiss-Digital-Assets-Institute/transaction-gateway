import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line import/no-unresolved
import NodeClient from '@hashgraph/sdk/lib/client/NodeClient';
import {
  AccountId,
  Client,
  PrivateKey,
  TopicCreateTransaction,
  TopicId,
  TopicMessageSubmitTransaction,
  Transaction,
  TransactionResponse,
} from '@hashgraph/sdk';
import { mockDeep } from 'jest-mock-extended';
import axios from 'axios';
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

  it('createTopic method should call execute on TopicCreateTransaction and return topic id', async () => {
    const topicId = '0.0.1';
    const executeStub = jest.fn(async () => {
      return {
        getReceipt: jest.fn(async () => {
          return { topicId };
        }),
      } as unknown as TransactionResponse;
    });
    const setSubmitKeyStub = jest.fn(() => {
      return {
        execute: executeStub,
      };
    });
    const setAdminKeySpy = jest.spyOn(TopicCreateTransaction.prototype, 'setAdminKey').mockImplementation(() => {
      return {
        setSubmitKey: setSubmitKeyStub,
      } as unknown as TopicCreateTransaction;
    });
    const resultTopicId = await service.createTopic();
    expect(setAdminKeySpy).toHaveBeenCalled();
    expect(setSubmitKeyStub).toHaveBeenCalled();
    expect(executeStub).toHaveBeenCalled();
    expect(resultTopicId).toBe(topicId);
  });

  it('sendMessageToTopic method should compose TopicMessageSubmitTransaction and return tx receipt', async () => {
    const topicId = new TopicId(0, 0, 1);
    const message = 'message';
    const receiptMock = { message };
    const executeStub = jest.fn(async () => {
      return {
        getReceipt: jest.fn(async () => {
          return receiptMock;
        }),
      } as unknown as TransactionResponse;
    });
    const setMessageStub = jest.fn(() => {
      return { execute: executeStub };
    });
    const setTopicIdSpy = jest.spyOn(TopicMessageSubmitTransaction.prototype, 'setTopicId').mockImplementation(() => {
      return { setMessage: setMessageStub } as unknown as TopicMessageSubmitTransaction;
    });

    const receipt = await service.sendMessageToTopic(message, topicId);
    expect(setTopicIdSpy).toHaveBeenCalledWith(topicId);
    expect(setMessageStub).toHaveBeenCalledWith(message);
    expect(executeStub).toHaveBeenCalled();
    expect(receipt).toBe(receiptMock);
  });
  it('sendMessageToTopic method should assign topicId if none provided', async () => {
    //@ts-expect-error ignore private access modifier
    const topicId = service.topicId;
    const message = 'message';
    const receiptMock = { message };
    const executeStub = jest.fn(async () => {
      return {
        getReceipt: jest.fn(async () => {
          return receiptMock;
        }),
      } as unknown as TransactionResponse;
    });
    const setMessageStub = jest.fn(() => {
      return { execute: executeStub };
    });
    const setTopicIdSpy = jest.spyOn(TopicMessageSubmitTransaction.prototype, 'setTopicId').mockImplementation(() => {
      return { setMessage: setMessageStub } as unknown as TopicMessageSubmitTransaction;
    });

    await service.sendMessageToTopic(message);
    expect(setTopicIdSpy).toHaveBeenCalledWith(topicId);
  });

  it('getTrxIdFromSequenceNumber method should fail because of request to mirror node transactions endpoint fails', async () => {
    let topicsGetRequestInvoked = false;
    // @ts-expect-error axios type checking is not correct because I've mocked it
    const getMock = (axios.get = jest.fn(async (url) => {
      if (url.includes('topics')) {
        topicsGetRequestInvoked = true;

        return { status: 200, data: { consensus_timestamp: 1234, transactions: [{ transaction_id: '1' }] } };
      }

      if (url.includes('transactions')) {
        return { status: 400, data: { consensus_timestamp: 1234, transactions: [{ transaction_id: '1' }] } };
      }
    }));
    let error: HttpException;
    try {
      await service.getTrxIdFromSequenceNumber('123');
    } catch (err) {
      error = err;
    }

    expect(error).toStrictEqual(new HttpException('Unexpected error occurred.', HttpStatus.BAD_GATEWAY));
    expect(getMock).toHaveBeenCalled();
    expect(topicsGetRequestInvoked).toBe(true);
  });

  it('getTrxIdFromSequenceNumber method should fail because of request to mirror node topics endpoint fails', async () => {
    // @ts-expect-error axios type checking is not correct because I've mocked it
    const getMock = (axios.get = jest.fn(async (url) => {
      if (url.includes('topics')) {
        return { status: 400, data: { consensus_timestamp: 1234, transactions: [{ transaction_id: '1' }] } };
      }
    }));
    let error;
    try {
      await service.getTrxIdFromSequenceNumber('123');
    } catch (err) {
      error = err;
    }
    expect(error).toStrictEqual(new HttpException('Unexpected error occurred.', HttpStatus.BAD_GATEWAY));
    expect(getMock).toHaveBeenCalled();
  });

  it('getTrxIdFromSequenceNumber method should should compose correct urls and return correct transaction id', async () => {
    const consensus_timestamp = 1234;
    const txId = '1';
    // @ts-expect-error axios type checking is not correct because I've mocked it
    const getMock = (axios.get = jest.fn(async () => {
      return { status: 200, data: { consensus_timestamp, transactions: [{ transaction_id: txId }] } };
    }));
    const resultTxId = await service.getTrxIdFromSequenceNumber('123');

    expect(getMock).toHaveBeenCalledWith('/api/v1/topics/undefined/messages/123', {});
    expect(getMock).toHaveBeenCalledWith(
      '/api/v1/transactions?limit=2&order=asc&timestamp=1234&transactiontype=CONSENSUSSUBMITMESSAGE',
      {},
    );
    expect(resultTxId).toBe(txId);
  });

  it('executeTransaction method should sign passed Transaction and execute it', async () => {
    const receiptMock = { receiptData: 'receiptData' };
    const getReceiptStub = jest.fn(() => {
      return receiptMock;
    });
    const executeStub = jest.fn(() => {
      return {
        getReceipt: getReceiptStub,
      };
    });
    const signStub = jest.fn(() => {
      return { execute: executeStub };
    });
    const transactionMock = {
      sign: signStub,
      execute: executeStub,
    } as unknown as Transaction;

    const receipt = await service.executeTransaction(transactionMock);
    expect(signStub).toHaveBeenCalledWith({});
    expect(executeStub).toHaveBeenCalledWith(client);
    expect(getReceiptStub).toHaveBeenCalledWith(client);
    expect(receipt).toBe(receiptMock);
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
    const signStub = jest.fn(() => {
      return { execute: executeStub };
    });
    const transactionMock = {
      sign: signStub,
      execute: executeStub,
    } as unknown as Transaction;

    await service.executeTransaction(transactionMock);
    expect(retries).toBe(expectedRetries);
  });

  it('executeTransaction method should fail when max retries number reached', async () => {
    let retries = 0;
    const expectedError = new HttpException(
      //@ts-expect-error ignore private access to property of a class
      `Transaction failed after ${service.MAX_RETRIES} attempts.`,
      HttpStatus.REQUEST_TIMEOUT,
    );
    const executeStub = jest.fn(() => {
      retries++;
      throw new Error('BUSY');
    });
    const signStub = jest.fn(() => {
      return { execute: executeStub };
    });
    const transactionMock = {
      sign: signStub,
      execute: executeStub,
    } as unknown as Transaction;
    let error;
    try {
      await service.executeTransaction(transactionMock);
    } catch (err) {
      error = err;
    }
    //@ts-expect-error ignore private access to property of a class
    expect(retries).toBe(service.MAX_RETRIES);
    expect(error).toStrictEqual(expectedError);
  });

  it('executeTransaction method should throw when unexpected errors happen', async () => {
    const errorMock = new Error();
    const expectedError = new HttpException('Unexpected error occurred.', HttpStatus.INTERNAL_SERVER_ERROR, {
      cause: errorMock,
    });
    const executeStub = jest.fn(() => {
      throw errorMock;
    });
    const signStub = jest.fn(() => {
      return { execute: executeStub };
    });
    const transactionMock = {
      sign: signStub,
      execute: executeStub,
    } as unknown as Transaction;
    let error;
    try {
      await service.executeTransaction(transactionMock);
    } catch (err) {
      error = err;
    }
    expect(error).toStrictEqual(expectedError);
  });

  it('should not call topicCreate function on application bootstrap if topic id exists', async () => {
    const serviceInstance = new HashgraphService(
      { get: jest.fn().mockReturnValue('0.0.1') } as unknown as ConfigService,
      {} as NodeClient,
      {} as PrivateKey,
      {} as AccountId,
    );
    //@ts-expect-error ignore private access
    serviceInstance.topicId = '0.0.1';
    //@ts-expect-error ignore typings
    jest.spyOn(TopicId, 'fromString').mockReturnValue('0.0.1');

    serviceInstance.createTopic = jest.fn();
    const localModule = await Test.createTestingModule({
      providers: [{ provide: HashgraphService, useValue: serviceInstance }],
    }).compile();
    const createTopicSpy = jest.spyOn(serviceInstance, 'createTopic');
    const app = localModule.createNestApplication();
    await app.init();
    expect(createTopicSpy).toHaveBeenCalledTimes(0);
    await app.close();
  });
});
