#!/bin/bash
set -m;
mkdir -p ./vault/data

nohup vault server -config=config.hcl > /dev/stdout &
sleep 5;

export VAULT_ADDR='http://0.0.0.0:8200';

vault operator init -key-threshold=1 -key-shares=1

vault status;

fg %1;
