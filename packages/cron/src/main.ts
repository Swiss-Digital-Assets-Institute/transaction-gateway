import { TransferTransaction } from '@hashgraph/sdk';
import { getClient, getConfig, getRefillAmount, validateEnv } from './functions';

export async function main() {
  validateEnv();
  const config = await getConfig();
  const client = getClient(config);
  const refillAmount = await getRefillAmount(config, client);

  if (refillAmount.toString() === '0') {
    console.log('Cron execution happened, no need to refill.');
    return;
  }

  const transaction = new TransferTransaction()
    .addHbarTransfer(config.refillerAccountId, -refillAmount)
    .addHbarTransfer(config.executorAccountId, refillAmount)
    .freezeWith(client);
  const signTx = await transaction.sign(config.refillerPrivateKey);
  const txResponse = await signTx.execute(client);
  const receipt = await txResponse.getReceipt(client);

  //Obtain the transaction consensus status
  const transactionStatus = receipt.status;
  console.log('The transaction consensus status ' + transactionStatus.toString());
  console.log(`Refill executed successfully. ${refillAmount.toString()} tokens transferred.`);
}
