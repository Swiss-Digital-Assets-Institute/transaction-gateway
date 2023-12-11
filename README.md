<p align="center">
  <img src="images/THA_Logo.png" width="200" alt="Nest Logo" />
</p>

  <h5 align="center">Hashgraph Labs</p>
  <h3 align="center">Transaction Gateway</p>

## Description

Monorepo that contains following Transaction Gateway packages: api-server, cli, cron and vault. The system provides automated and secure ways of storing of wallet keys, refilling wallet balances, signing and executing of transactions.

## Installation

```bash
$ npm install -g pnpm
$ pnpm install
```

## Running the app

> **_NOTE:_** This flow must be done only the first time, after initialization everything can be started with `docker compose up`.
> Each time vault is restarted it must be unsealed again, refer to [Unseal](#unseal) section. After vault is unsealed api-server and cron must be restarted with `docker-compose restart backend cron`.

### Env

Before starting the app you would need to setup env variables. To do so first go to the root dir of monorepo and copy all `.env.example*` using this commands:

```bash
$ cp .env.api-server.example .env.api-server
$ cp .env.cli.example .env.cli
$ cp .env.cron.example .env.cron
```

### Vault

After that launch docker daemon and run the vault container:

```bash
$ docker-compose up vault -d --build
```

Get vault container logs:

```bash
$ docker logs vault
```

Find lines with `Unseal Key 1` and `Initial Root Token`, you will need these values in future:

```
Unseal Key 1: [value]
Initial Root Token: [value]
```

### Unseal

In next step we will unseal vault. To do so it is needed to execute following commands:

```bash
$ docker exec -it vault bash
# inside container
$ export VAULT_ADDR='http://0.0.0.0:8200';
$ vault operator unseal
# paste Unseal Key 1
```

and paste value you've copied in previous step. Now you should receive vault status message where we can spectate that it is unsealed.

### App roles

Upcoming commands will create all of the needed app roles and assign policies to them:

```bash
$ vault login
# paste Initial Root Token
$ sh docker/create-app-roles.sh
$ exit
```

You can see three sets of data in logs for such `appRoleNames`: `executor`, `refiller`, `cli`. They looks similar to this:

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

You need to take `role_id` and `secret_id` fields of each `appRole` and use them to update env files correspondingly:

```
executor -> .env.api-server
refiller -> .env.cron
cli -> .env.cli
```

### Wallets set up

Next step will be setting up executor and refiller wallets in vault, to do so use next commands:

```bash
# executor
$ pnpm cli setWallet  --accountId [EXECUTOR_ACCOUNT_ID] --publicKey [EXECUTOR_PUBLIC_KEY] --privateKey [EXECUTOR_PRIVATE_KEY] --secretKey executorKeyPair

# refiller
$ pnpm cli setWallet  --accountId [REFILLER_ACCOUNT_ID] --publicKey [REFILLER_PUBLIC_KEY] --privateKey [REFILLER_PRIVATE_KEY] --secretKey refillerKeyPair
```

> **_NOTE:_** Both `refiller` and `executor` must be _ED25519_ keys.

### Launch

Final step, starting up api server, cli and cron:

```bash
$ docker-compose up backend cli cron --build -d
```

That's it, now you should be able to use the Tx Gateway.

## Test

```bash
# unit tests
$ pnpm -r test

# test coverage
$ pnpm -r test:cov
```

## Linting and formatting

```bash
# for linting
$ pnpm lint

# for formatting
$ pnpm format
```

## Build

```bash
$ pnpm -r build
```
