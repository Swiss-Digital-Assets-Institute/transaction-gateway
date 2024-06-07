import path from 'path';
import { AccountCreateTransaction, AccountId, Client, Hbar, PrivateKey } from '@hashgraph/sdk';
import { config } from 'dotenv';
config({ path: path.resolve(__dirname, '.env') });

const myAccountId = AccountId.fromString(process.env.ACCOUNT_ID);
const myPrivateKey = PrivateKey.fromString(process.env.PRIVATE_KEY);

const maxTransactionFee = new Hbar(40);

const client = Client.forTestnet();
// const client = Client.forMainnet();
client.setOperator(myAccountId, myPrivateKey).setDefaultMaxTransactionFee(maxTransactionFee);

async function main(responsibility: 'executor' | 'refiller') {
  console.log(`"Creating" a new account for ${responsibility}`);

  const privateKey = PrivateKey.generateED25519();
  const publicKey = privateKey.publicKey;

  const response = await new AccountCreateTransaction()
    .setInitialBalance(new Hbar(1))
    .setKey(publicKey)
    .freezeWith(client)
    .execute(client);

  const receipt = await response.getReceipt(client);

  console.log(`${responsibility} account ID: ${receipt.accountId.toString()}`);
  console.log(`${responsibility} DER encoded public key: `, privateKey.publicKey.toStringDer());
  console.log(`${responsibility} DER encoded private key: ${privateKey.toStringDer()}`);
  console.log(`${responsibility} Hex encoded private key: `, privateKey.toStringRaw());
}

main('executor')
  .then(() => {
    console.log('Success');
  })
  .catch((err) => {
    console.error(err);
  });

main('refiller')
  .then(() => {
    console.log('Success');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
  });
