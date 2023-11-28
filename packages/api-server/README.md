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

## DB migrations

```bash
# development
$ npx prisma migrate dev

# for any remote environment
$ npx prisma migrate deploy

# for seeding the db with some mocked data
$ pnpm seed

# run to generate client with typings if there are any type issues
$ npx prisma generate

# prettify prisma.schema file
$ npx prisma format
```

## Running the app

Before starting the app you would need to setup env variables. To do so first copy `.env.example` using this command:

```bash
$ cp .env.example .env
```

Then fill out all of the values in newly created `.env` file. App will pickup those variables automatically during the startup.

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
