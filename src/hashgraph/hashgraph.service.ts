import { AccountId, Transaction, Client } from '@hashgraph/sdk';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AccountIdResponse, ExecuteTransactionReturnType } from './definitions';

@Injectable()
export class HashgraphService {
  private readonly logger = new Logger(HashgraphService.name);
  private readonly MAX_RETRIES = 30;

  constructor(private readonly client: Client, private readonly accountId: AccountId) {}

  async executeTransaction(transactionString: string): Promise<ExecuteTransactionReturnType> {
    // Transaction deserialization
    const receivedBytesTx = Buffer.from(transactionString, 'base64');
    const transaction = Transaction.fromBytes(receivedBytesTx);

    // Retry logic for cases when network return BUSY code
    let retries = 0;
    while (retries < this.MAX_RETRIES) {
      try {
        const txResponse = await transaction.execute(this.client);
        const txReceipt = await txResponse.getReceipt(this.client);

        this.logger.debug(txResponse);

        // If the transaction succeeded, return the receipt
        return { transactionReceipt: txReceipt, transactionResponse: txResponse };
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

  async getOperatorAccountId(): Promise<AccountIdResponse> {
    return { accountId: this.accountId.toString() };
  }
}
