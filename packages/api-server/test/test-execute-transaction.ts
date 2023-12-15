import { Client, PrivateKey, TopicCreateTransaction, TransactionId } from '@hashgraph/sdk';
import axios from 'axios';

const privateKey = PrivateKey.fromStringED25519('your pk');
const apiKey = 'de364303-0d0e-401f-838a-61d451d10d3a';

const client = Client.forTestnet();

async function request(): Promise<void> {
  const operatorAccountId = await axios.get('http://localhost:3000/v1/transaction/operatorAccountId', {
    headers: { Authorization: apiKey },
  });

  const freezedTx = new TopicCreateTransaction()
    .setAdminKey(privateKey)
    .setSubmitKey(privateKey)
    .setTransactionId(TransactionId.generate(operatorAccountId.data.accountId))
    .freezeWith(client);

  const signedTx = await freezedTx.sign(privateKey);

  const bytes = signedTx.toBytes();
  const txString = Buffer.from(bytes).toString('base64');
  const body = {
    transaction: txString,
  };
  await axios.post('http://localhost:3000/v1/transaction/execute', body, { headers: { Authorization: apiKey } });
}

request().then(() => {
  console.log('Done!');

  process.exit(0);
});
