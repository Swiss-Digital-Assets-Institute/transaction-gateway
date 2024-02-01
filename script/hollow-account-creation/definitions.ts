export type WalletInfo = {
  accountId?: string;
  aliasAccountId: string;
  publicKey: string;
  privateKeyDer: string;
  // privateKeyHex: string;
};

export type WalletInfos = {
  executorWalletInfo?: WalletInfo;
  refillerWalletInfo?: WalletInfo;
};
