import { AccountId, PrivateKey } from '@hashgraph/sdk';

export type ConfigurationType = {
  hashgraphNetwork: string;
  refillerAccountId: AccountId;
  refillerPrivateKey: PrivateKey;
  executorAccountId: AccountId;
  hbarAmount: number;
};
