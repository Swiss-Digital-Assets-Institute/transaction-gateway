import {
  AccountId,
  Transaction,
  Client,
  PublicKey,
  PrivateKey,
  TransactionReceipt,
  TransactionResponse,
} from '@hashgraph/sdk';
import { HttpException, HttpStatus, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { VaultManagerService } from '../vault-manager/vault-manager.service';
import { ExecuteTransactionResponseDto } from './dto/execute-transaction.response.dto';
import { AccountIdResponseDto } from './dto/account-id.response.dto';

@Injectable()
export class HashgraphService implements OnApplicationBootstrap {
  private readonly logger = new Logger(HashgraphService.name);
  private readonly MAX_RETRIES = 30;
  private accountId: AccountId;
  private publicKey: PublicKey;
  private privateKey: PrivateKey;

  constructor(private client: Client, private readonly vaultManager: VaultManagerService) {}

  async onApplicationBootstrap() {
    await this.fetchSecrets();
  }

  async executeTransaction(transactionString: string): Promise<ExecuteTransactionResponseDto> {
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
        return this.transformTransactionResult(txReceipt, txResponse);
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

  async getOperatorAccountId(): Promise<AccountIdResponseDto> {
    return { accountId: this.accountId.toString() };
  }

  async fetchSecrets() {
    const secretAccountInfoData = await this.vaultManager.getAccountInfoSecret();
    this.accountId = secretAccountInfoData.accountId;
    this.publicKey = secretAccountInfoData.publicKey;
    this.privateKey = secretAccountInfoData.privateKey;
    this.client = this.client.setOperator(this.accountId, this.privateKey);
  }

  transformTransactionResult(
    txReceipt: TransactionReceipt,
    txResponse: TransactionResponse,
  ): ExecuteTransactionResponseDto {
    const txResponseJSON = txResponse.toJSON();

    return {
      transactionReceipt: {
        accountId: txReceipt.accountId?.toString(),
        status: txReceipt.status._code,
        fileId: txReceipt.fileId?.toString(),
        contractId: txReceipt.contractId?.toString(),
        topicId: txReceipt.topicId?.toString(),
        tokenId: txReceipt.tokenId?.toString(),
        scheduleId: txReceipt.scheduleId?.toString(),
        exchangeRate: txReceipt.exchangeRate?.toString(),
        topicSequenceNumber: txReceipt.topicSequenceNumber?.toString(),
        topicRunningHash: txReceipt.topicRunningHash?.toString(),
        totalSupply: txReceipt.totalSupply?.toString(),
        scheduledTransactionId: txReceipt.scheduledTransactionId?.toString(),
        serials: txReceipt.serials,
        duplicates: txReceipt.duplicates,
        children: txReceipt.children,
      },
      transactionResponse: {
        nodeId: txResponseJSON.nodeId,
        transactionHash: txResponseJSON.transactionHash,
        transactionId: txResponseJSON.transactionId,
      },
    };
  }
}
