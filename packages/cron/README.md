<p align="center">
  <img src="../../images/THA_Logo.png" width="200" alt="Nest Logo" />
</p>

  <h5 align="center">Hashgraph Labs</p>
  <h3 align="center">Transaction Gateway CRON</p>

## Description

Cron for transferring tokens from `refiller` to `executor`. When balance of `executor`'s wallet reaches `BALANCE_THRESHOLD` it gets refilled to `BALANCE_TARGET`.

## Installation

```bash
$ pnpm install
```

## Run

Launch cron:

```bash
$ pnpm launch
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
