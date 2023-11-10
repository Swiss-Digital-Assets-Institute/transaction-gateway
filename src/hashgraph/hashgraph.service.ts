import {
  AccountId,
  PrivateKey,
  Transaction,
  Client,
  TopicCreateTransaction,
  TopicId,
  TopicMessageSubmitTransaction,
  TransactionReceipt,
} from '@hashgraph/sdk';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class HashgraphService {
  // Singleton
  private topicId: TopicId;
  private readonly logger = new Logger(HashgraphService.name);
  private readonly MAX_RETRIES = 30;

  constructor(
    private readonly configService: ConfigService,
    private readonly client: Client,
    private readonly privateKey: PrivateKey,
    private readonly accountId: AccountId,
  ) {}

  async createTopic(): Promise<TopicId> {
    //Create the transaction
    const tx = new TopicCreateTransaction().setAdminKey(this.privateKey).setSubmitKey(this.privateKey);
    this.logger.debug(tx);

    //Sign with the client operator private key and submit the transaction to a Hedera network
    const txResponse = await tx.execute(this.client);

    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(this.client);
    this.logger.debug(receipt);
    this.logger.debug(`Created new TopicID: ${receipt.topicId}`);
    return receipt.topicId;
  }

  async sendMessageToTopic(message: string, topicId: TopicId = this.topicId): Promise<TransactionReceipt> {
    //Create the transaction
    const transaction = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message)
      .execute(this.client);
    // TODO: Error Handling
    this.logger.debug(transaction);

    //Request the receipt of the transaction
    const receipt = await transaction.getReceipt(this.client);
    this.logger.debug(receipt);
    return receipt;
  }

  async getTrxIdFromSequenceNumber(sequenceNumber: string): Promise<string> {
    let transactionId: string;

    try {
      // Get message with sequence number from mirrornode
      const message = await axios.get(
        `${this.configService.get<string>('HASHGRAPH_MIRROR_NODE_URL')}/api/v1/topics/${
          this.topicId
        }/messages/${sequenceNumber}`,
        {},
      );
      if (message.status < 200 || message.status >= 300) {
        this.logger.debug(message.data);
        throw new HttpException('Unexpected error occurred.', HttpStatus.BAD_GATEWAY);
      }

      // Extract consensus timestamp from message
      const consensus_timestamp: string = message.data.consensus_timestamp;
      this.logger.debug('consensus_timestamp: ' + consensus_timestamp);

      // Search transaction with this consensus timestamp
      const transaction = await axios.get(
        `${this.configService.get<string>(
          'HASHGRAPH_MIRROR_NODE_URL',
        )}/api/v1/transactions?limit=2&order=asc&timestamp=${consensus_timestamp}&transactiontype=CONSENSUSSUBMITMESSAGE`,
        {},
      );
      if (transaction.status < 200 || transaction.status >= 300) {
        this.logger.debug(transaction.data);
        throw new HttpException('Unexpected error occurred.', HttpStatus.BAD_GATEWAY);
      }

      transactionId = transaction.data.transactions[0].transaction_id;
      // Replace '-' to match correct trx id format
      transactionId = transactionId.replace(/-/, '@');
      transactionId = transactionId.replace(/-/, '.');
    } catch (error) {
      this.logger.debug(error);
      throw new HttpException('Unexpected error occurred.', HttpStatus.BAD_GATEWAY);
    }

    this.logger.debug(transactionId);
    return transactionId;
  }

  async executeTransaction(transaction: Transaction) {
    let retries = 0;
    while (retries < this.MAX_RETRIES) {
      try {
        const txSign = await transaction.sign(this.privateKey);
        const txSubmit = await txSign.execute(this.client);
        const txReceipt = await txSubmit.getReceipt(this.client);

        this.logger.debug(txSubmit);

        // If the transaction succeeded, return the receipt
        return txReceipt;
      } catch (err) {
        // If the error is BUSY, retry the transaction
        if (err.toString().includes('BUSY')) {
          retries++;
          this.logger.log(`Retry attempt: ${retries}`);
        } else {
          // If the error is not BUSY, throw the error
          this.logger.debug(err);
          throw new HttpException('Unexpected error occurred.', HttpStatus.INTERNAL_SERVER_ERROR, { cause: err });
        }
      }
    }
    throw new HttpException(`Transaction failed after ${this.MAX_RETRIES} attempts.`, HttpStatus.REQUEST_TIMEOUT);
  }
}
