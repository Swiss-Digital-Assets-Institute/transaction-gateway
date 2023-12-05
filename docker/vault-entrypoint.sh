#!/bin/bash
set -m;
mkdir -p ./vault/data

nohup vault server -config=config.hcl > /dev/stdout &
sleep 5;

export VAULT_ADDR='http://0.0.0.0:8200';

vault operator init -key-threshold=1 -key-shares=1

# set -m;
# nohup vault server -dev -dev-root-token-id=${VAULT_DEV_ROOT_TOKEN_ID} -dev-listen-address=0.0.0.0:8200 > /dev/stdout &
# sleep 5;

# export VAULT_ADDR='http://0.0.0.0:8200';
# export VAULT_TOKEN=${VAULT_DEV_ROOT_TOKEN_ID};

vault status;

fg %1;
