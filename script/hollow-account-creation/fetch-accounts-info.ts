import { readFile, writeFile } from 'fs/promises';
import { AccountId, AccountInfoQuery, Client, PrivateKey } from '@hashgraph/sdk';
import { config } from 'dotenv';
import { WalletInfo, WalletInfos } from './definitions';
import { walletInfosFilePath } from './constant';
config();

const myAccountId = AccountId.fromString(process.env.ACCOUNT_ID);
const myPrivateKey = PrivateKey.fromString(process.env.PRIVATE_KEY);

const client = Client.forTestnet();

client.setOperator(myAccountId, myPrivateKey);

async function getAccInfo(walletInfo: WalletInfo) {
  //Create the account info query
  const query = new AccountInfoQuery().setAccountId(walletInfo.aliasAccountId);

  //Sign with client operator private key and submit the query to a Hedera network
  const accountInfo = await query.execute(client);

  //Print the account info to the console
  console.log(accountInfo);
  return accountInfo;
}

async function main() {
  const walletInfos: WalletInfos = JSON.parse((await readFile(walletInfosFilePath)).toString());
  const executorQueryResponse = await getAccInfo(walletInfos.executorWalletInfo);
  const refillerQueryResponse = await getAccInfo(walletInfos.refillerWalletInfo);
  walletInfos.executorWalletInfo.accountId = executorQueryResponse.accountId.toString();
  walletInfos.refillerWalletInfo.accountId = refillerQueryResponse.accountId.toString();

  await writeFile(walletInfosFilePath, JSON.stringify(walletInfos, null, 2));
}

main()
  .then(() => {
    console.log('Success');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
  });
