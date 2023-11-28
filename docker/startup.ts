import { promisify } from 'util';
import childProcess from 'child_process';
import { resolve } from 'path';
import { readFile, writeFile, access, constants, copyFile } from 'fs/promises';
import axios from 'axios';
import { config } from 'dotenv';
import cla from 'command-line-args';
import { AppRoleData } from './definitions';
config();

const exec = promisify(childProcess.exec);

const appRoles = ['executor', 'refiller', 'cli'];

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

const optionDefinitions = [{ name: 'build', type: Boolean }];
const { build } = cla(optionDefinitions);

async function main(): Promise<void> {
  const start = Date.now();
  await execute('docker-compose down');

  startVault();
  await waitForVault();
  const std = await execute('docker logs vault');
  const splitted = std.stdout.split('Success! Data written to: auth/approle/role/');
  const appRoleDataArray = [];
  for (let i = 1; i < splitted.length; i++) {
    const section = splitted[i];
    const appRoleData = getAppRoleDataFromString(section);
    appRoleDataArray.push(appRoleData);
  }
  console.log('appRoleDataArray', appRoleDataArray);
  await updateEnvFiles(appRoleDataArray);
  await setWalletsKeys();

  await execute('docker-compose up backend_db -d');
  await execute(`docker-compose create backend ${build ? '--build' : ''}`);
  await execute('docker-compose start backend');
  const end = Date.now();

  console.log(`Done in ${(end - start) / 1000} s.`);
}

async function execute(command: string) {
  console.log(`Running command: ${command} ...`);
  const logs = await exec(command);
  console.log('Stdout:', logs.stdout);
  console.log('Stderr:', logs.stderr);
  console.log(`Command '${command}' is executed.`);

  return logs;
}

function getAppRoleDataFromString(string: string): AppRoleData {
  const appRole = string.split('\n')[0];
  if (!appRoles.includes(appRole)) throw new Error(`No AppRole with name ${appRole}`);
  const appRoleId = string.split('role_id')[1].split('\n')[0].trim();
  const appRoleSecretId = string.split('secret_id')[1].split('\n')[0].trim();
  return {
    appRole,
    appRoleId,
    appRoleSecretId,
  };
}

async function updateEnvFiles(appRoleDataArray: AppRoleData[]) {
  for (let i = 0; i < appRoleDataArray.length; i++) {
    const appRoleData = appRoleDataArray[i];
    await updateEnvFileStrategy(appRoleData);
  }
}

async function updateEnvFileStrategy(appRoleData: AppRoleData) {
  let path: string;
  switch (appRoleData.appRole) {
    case 'executor':
      path = resolve(__dirname, '../packages/api-server/.env');
      break;
    case 'refiller':
      path = resolve(__dirname, '../packages/cron/.env');
      break;
    case 'cli':
      path = resolve(__dirname, '../packages/cli/.env');
      break;

    default:
      throw new Error(`No handler for ${appRoleData.appRole} app role.`);
  }
  updateEnvFile(appRoleData, path);
}

async function updateEnvFile(appRoleData: AppRoleData, path: string) {
  await createEnvIfNotExist(path);
  const appRoleIdRegex = /^VAULT_APP_ROLE_ID=[0-9ABCDEFabcdef-]*$/gm;
  const appRoleSecretIdRegex = /^VAULT_APP_ROLE_SECRET_ID=[0-9ABCDEFabcdef-]*$/gm;
  let env = (await readFile(path)).toString();
  env = env.replace(appRoleIdRegex, `VAULT_APP_ROLE_ID=${appRoleData.appRoleId}`);
  env = env.replace(appRoleSecretIdRegex, `VAULT_APP_ROLE_SECRET_ID=${appRoleData.appRoleSecretId}`);
  await writeFile(path, env);
}

async function createEnvIfNotExist(path: string) {
  try {
    await access(path, constants.F_OK);
  } catch (err) {
    await copyFile(path + '.example', path);
  }
}

async function setWalletsKeys() {
  const {
    EXECUTOR_ACCOUNT_ID,
    EXECUTOR_PUBLIC_KEY,
    EXECUTOR_PRIVATE_KEY,
    REFILLER_ACCOUNT_ID,
    REFILLER_PUBLIC_KEY,
    REFILLER_PRIVATE_KEY,
  } = process.env;
  await exec(
    `pnpm cli setWallet  --accountId ${EXECUTOR_ACCOUNT_ID} --publicKey ${EXECUTOR_PUBLIC_KEY} --privateKey ${EXECUTOR_PRIVATE_KEY} --secretKey executorKeyPair`,
  );
  await exec(
    `pnpm cli setWallet  --accountId ${REFILLER_ACCOUNT_ID} --publicKey ${REFILLER_PUBLIC_KEY} --privateKey ${REFILLER_PRIVATE_KEY} --secretKey refillerKeyPair`,
  );
}

async function waitForVault() {
  const retryDelay = 3000;
  let retry = true;
  while (retry) {
    try {
      await axios.get('http://0.0.0.0:8200/v1/sys/health');
      retry = false;
    } catch (error) {
      console.log(error.cause);
      console.log('Retrying...');
      await timer(retryDelay);
    }
  }
  await timer(5000);
}

function startVault() {
  const params = ['up', 'vault', '-d'];
  if (build) params.push('--build');

  const ls = childProcess.spawn('docker-compose', params);

  ls.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  ls.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  ls.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}

main().then(() => {
  console.log('started');
});
