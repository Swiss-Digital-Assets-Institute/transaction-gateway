export type SecretItem<T extends SecretItemData> = {
  name: string;
  data: T;
};
export type SecretAccountInfoData = {
  accountId: string;
  publicKey: string;
  privateKey: string;
};

export type SecretItemStringData = {
  value: string;
};
export type SecretItemData = SecretAccountInfoData | SecretItemStringData;
