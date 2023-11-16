import { AccountId, PrivateKey, PublicKey, TransactionReceipt, TransactionResponse } from '@hashgraph/sdk';

export type AccountInfoData = {
  accountId: AccountId;
  publicKey: PublicKey;
  privateKey: PrivateKey;
};

export type ExecuteTransactionReturnType = {
  transactionReceipt: TransactionReceipt;
  transactionResponse: TransactionResponse;
};

export type AccountIdResponse = {
  accountId: string;
};
