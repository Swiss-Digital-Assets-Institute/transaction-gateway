import { readFile, writeFile } from 'fs/promises';
import { writeFileSync } from 'fs';
import { PrivateKey } from '@hashgraph/sdk';
import { WalletInfos } from './definitions';
import { walletInfosFilePath } from './constant';

writeFileSync(walletInfosFilePath, '{}');

async function main(responsibility: 'executor' | 'refiller') {
  console.log(`"Creating" a new account for ${responsibility}`);

  const privateKey = PrivateKey.generateED25519();
  const publicKey = privateKey.publicKey;

  // Assuming that the target shard and realm are known.
  // For now they are virtually always 0 and 0.
  const aliasAccountId = publicKey.toAccountId(0, 0);

  console.log(`${responsibility} alias account ID: ${aliasAccountId.toString()}`);
  console.log(`${responsibility} aliasKey: ${aliasAccountId.aliasKey.toString()}`);
  console.log(`${responsibility} private key: ${privateKey.toStringDer()}`);

  const walletInfos: WalletInfos = JSON.parse((await readFile(walletInfosFilePath)).toString());
  walletInfos[`${responsibility}WalletInfo`] = {
    aliasAccountId: aliasAccountId.toString(),
    publicKey: aliasAccountId.aliasKey.toString(),
    privateKeyDer: privateKey.toStringDer(),
  };
  await writeFile(walletInfosFilePath, JSON.stringify(walletInfos, null, 2));
}

main('executor')
  .then(() => {
    console.log('Success');
    main('refiller')
      .then(() => {
        console.log('Success');
        process.exit(0);
      })
      .catch((err) => {
        console.error(err);
      });
  })
  .catch((err) => {
    console.error(err);
  });
