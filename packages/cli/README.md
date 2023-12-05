<p align="center">
  <img src="../../images/THA_Logo.png" width="200" alt="Nest Logo" />
</p>

  <h5 align="center">Hashgraph Labs</p>
  <h3 align="center">Transaction Gateway CLI</p>

## Description

CLI for setting `refiller` and `executor` wallets.

## Installation

```bash
$ pnpm install
```

## Commands

Executor wallet setup:

```bash
# executor
$ pnpm setWallet  --accountId [EXECUTOR_ACCOUNT_ID] --publicKey [EXECUTOR_PUBLIC_KEY] --privateKey [EXECUTOR_PRIVATE_KEY] --secretKey executorKeyPair
```

Refiller wallet setup:

```bash
# refiller
$ pnpm setWallet  --accountId [REFILLER_ACCOUNT_ID] --publicKey [REFILLER_PUBLIC_KEY] --privateKey [REFILLER_PRIVATE_KEY] --secretKey refillerKeyPair
```

## Docker

Have a look at **Running the app** section in root folder README.md.

## Test

```bash
# unit tests
$ pnpm test

# test coverage
$ pnpm test:cov
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
$ pnpm build
```
