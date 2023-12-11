import { AccountId, PrivateKey, PublicKey } from '@hashgraph/sdk';

export type AccountInfoData = {
  accountId: AccountId;
  publicKey: PublicKey;
  privateKey: PrivateKey;
};
