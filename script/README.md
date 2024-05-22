## Description

Scripts that is used for account creation:

1. Creation of hollow account with alias
2. Creation without alias

### Env

Before starting each of the scripts you would need to setup env variables. To do so first go to the respective script dir of monorepo and copy `.env.example` using this commands:

```bash
$ cp .env.example .env
```

And fill it out with operator keys.

## Usage

### Hollow account creation

From the root dir of tx gateway repo run:

```bash
$ pnpm create-accounts:hollow
```

Logs will reflect the same data as you can find in `wallet-infos.ts` file.
Next step is transferring funds to newly created accounts, after that they will no longer be hollow accounts as just before transfer network will automatically create and execute `AccountCreateTransaction`.

Now you can fetch real account ids of both accounts with command:

```bash
$ pnpm fetch-accounts-info:hollow
```

Logs will reflect the same data as you can find in `wallet-infos.ts` file.

### Regular account creation

Simply run next command from tx gateway root directory:

```bash
$ pnpm create-accounts
```

Logs will show all of the needed accounts info.
