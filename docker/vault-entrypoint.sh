#!/bin/bash
# vault server -dev
set -m;
nohup vault server -dev -dev-root-token-id=${VAULT_DEV_ROOT_TOKEN_ID} -dev-listen-address=0.0.0.0:8200 > /dev/stdout &
sleep 5;

export VAULT_ADDR='http://0.0.0.0:8200';
export VAULT_TOKEN=${VAULT_DEV_ROOT_TOKEN_ID};

vault status;
vault policy write app app-policy.vault.hcl
vault auth enable approle;
vault write auth/approle/role/app \
    token_policies="app" \
    secret_id_ttl=10m \
    token_num_uses=10 \
    token_ttl=20m \
    token_max_ttl=30m \
    secret_id_num_uses=40;
vault read auth/approle/role/app/role-id;
fg %1;
