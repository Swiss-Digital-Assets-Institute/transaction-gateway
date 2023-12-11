import commandLineArgs from 'command-line-args';
import { setWallet } from './set-wallet';

const optionDefinitions = [
  { name: 'secretKey', type: String },
  { name: 'accountId', type: String },
  { name: 'publicKey', type: String },
  { name: 'privateKey', type: String },
];

const options = commandLineArgs(optionDefinitions);

setWallet(options).then(() => {
  console.log('Success!');
  process.exit(0);
});
