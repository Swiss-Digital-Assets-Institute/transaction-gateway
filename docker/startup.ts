import { promisify } from 'util';
import childProcess from 'child_process';
import { resolve } from 'path';
import { readFile, writeFile, access, constants, copyFile } from 'fs/promises';
import axios from 'axios';
import { AppRoleData } from './definitions';

const exec = promisify(childProcess.exec);

const appRoles = ['executor', 'refiller', 'cli'];

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

async function main(): Promise<void> {
  await exec('docker-compose stop vault');
  startVault();
  await waitForVault();
  const std = await exec('docker logs vault');
  const splitted = std.stdout.split('Success! Data written to: auth/approle/role/');
  const appRoleDataArray = [];
  for (let i = 1; i < splitted.length; i++) {
    const section = splitted[i];
    const appRoleData = getAppRoleDataFromString(section);
    appRoleDataArray.push(appRoleData);
  }
  console.log('appRoleDataArray', appRoleDataArray);
  updateEnvFiles(appRoleDataArray);
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
  const ls = childProcess.spawn('docker-compose', ['up', 'vault', '--build', '-d']);

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
  console.log('start');
});
