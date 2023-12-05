<p align="center">
  <img src="images/THA_Logo.png" width="200" alt="Nest Logo" />
</p>

  <h3 align="center">Hashgraph Labs</p>

## Description

The boilerplate for NestJS applications which use Prisma ORM, includes mailing, hashgraph and user modules, docker for main server and for db, husky precommit hook, prettier & eslint configuration, API key guard. Project has CI/CD scripts for GH actions and 100% test coverage check in there.

## Installation

```bash
$ pnpm install
```

## Running the app

### Manual

> **_NOTE:_** This flow must be redone each time the vault is restarted.

Before starting the app you would need to setup env variables. To do so first go to the root dir of monorepo and copy `.env.example` using this command:

```bash
$ cp .env.example .env
```

Copy other env files as well, but we will need them in further steps:

```bash
$ cp .env.api-server.example .env.api-server
$ cp .env.cli.example .env.cli
$ cp .env.cron.example .env.cron
```

Then fill out `VAULT_ROOT_TOKEN` variable value `.env` file. The value is the root key to the vault so in prod envs must be kept secure.

After that launch docker daemon and run the vault container:

```bash
$ docker-compose up vault -d --build
```

Go to vault container logs and you will see three sets of data for such `appRoleNames`: `executor`, `refiller`, `cli`. They will look similar to this:

```
Success! Data written to: auth/approle/role/[appRoleName]
Key        Value
---        -----
role_id    760225aa-85f9-d7cd-52dd-a21217c9d01f
Key                   Value
---                   -----
secret_id             2e38c5d7-0807-ed72-26d1-aad02db4f445
secret_id_accessor    0fd21897-1d46-d807-ce36-ee4be23b74d2
secret_id_num_uses    40
secret_id_ttl         8h
```

You need to take `role_id` and `secret_id` fields of each app role and use them to update env files correspondingly:

```
executor -> .env.api-server
refiller -> .env.cron
cli -> .env.cli
```

Next step will be setting up executor and refiller wallets in vault, to do so use next commands:

```bash
$ pnpm cli setWallet  --accountId [EXECUTOR_ACCOUNT_ID] --publicKey [EXECUTOR_PUBLIC_KEY] --privateKey [EXECUTOR_PRIVATE_KEY] --secretKey executorKeyPair

$ pnpm cli setWallet  --accountId [REFILLER_ACCOUNT_ID] --publicKey [REFILLER_PUBLIC_KEY] --privateKey [REFILLER_PRIVATE_KEY] --secretKey refillerKeyPair
```

Final step, starting up api server:

```bash
$ docker-compose create backend --build
$ docker compose start backend
```

That's it, now you should be able to use tx gateway.

### Automated

Go to root directory and create a copy of env file:

```bash
$ cp .env.example .env
```

And fill out all variables inside

After you have env set up now its time to run migrations against DB. Use [this](#db-migrations) commands to deal with it.

```bash
# development
$ pnpm start

# watch mode
$ pnpm start:dev

# production mode
$ pnpm start:prod
```

## Test

```bash
# unit tests
$ pnpm test

# e2e tests
$ pnpm test:e2e

# test coverage
$ pnpm test:cov

# test specific files in watch mode
$ pnpm test:watch
```

## Linting and formatting

```bash
# for linting
$ pnpm lint

# for formatting
$ pnpm format
```
