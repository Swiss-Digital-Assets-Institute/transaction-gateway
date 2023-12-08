import { AccountId, PrivateKey } from '@hashgraph/sdk';

export type ConfigurationType = {
  hashgraphNetwork: string;
  refillerAccountId: AccountId;
  refillerPrivateKey: PrivateKey;
  executorAccountId: AccountId;
  balanceThreshold: number;
  balanceTarget: number;
};

export type SecretAccountInfoData = {
  accountId: string;
  publicKey: string;
  privateKey: string;
};
