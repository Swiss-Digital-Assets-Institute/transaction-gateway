import * as fs from 'fs/promises';
import * as path from 'path';
import * as uuid from 'uuid';

async function generateApiKey(): Promise<void> {
  const newApiKey = uuid.v4();
  const envFilePath = path.resolve(__dirname, '../.env');
  const envString = (await fs.readFile(envFilePath)).toString();
  const regex = /^API_KEY=[a-zA-z0-9-]+$/gm;
  const matchArr = envString.match(regex);
  const apiKeyLine = matchArr[matchArr.length - 1];
  const apiKeyLineReplacement = `API_KEY=${newApiKey}`;
  const newEnvString = envString.replace(apiKeyLine, apiKeyLineReplacement);
  await fs.writeFile(envFilePath, Buffer.from(newEnvString, 'utf-8'));
  console.log('New API key is:', newApiKey);
}

generateApiKey().then(() => {
  console.log('Done!');

  process.exit(0);
});
