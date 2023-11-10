export type SecretItem<T extends SecretItemData> = {
  name: string;
  data: T;
};
export type SecretItemKeyPairData = {
  publicKey: string;
  privateKey: string;
};

export type SecretItemStringData = {
  value: string;
};
export type SecretItemData = SecretItemKeyPairData | SecretItemStringData;
