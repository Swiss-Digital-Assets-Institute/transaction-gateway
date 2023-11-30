#!/bin/bash
# vault server -dev
set -m;
nohup vault server -dev -dev-root-token-id=${VAULT_DEV_ROOT_TOKEN_ID} -dev-listen-address=0.0.0.0:8200 > /dev/stdout &
sleep 5;

export VAULT_ADDR='http://0.0.0.0:8200';
export VAULT_TOKEN=${VAULT_DEV_ROOT_TOKEN_ID};

vault status;

vault policy write executor ./policies/executor-policy.vault.hcl
vault policy write refiller ./policies/refiller-policy.vault.hcl
vault policy write cli ./policies/cli-policy.vault.hcl
vault auth enable approle;

vault write auth/approle/role/executor \
    token_policies="executor" \
    secret_id_ttl=8h \
    token_num_uses=10 \
    token_ttl=20m \
    token_max_ttl=30m \
    secret_id_num_uses=40;
vault read auth/approle/role/executor/role-id;
vault write -f auth/approle/role/executor/secret-id;

vault write auth/approle/role/refiller \
    token_policies="refiller" \
    secret_id_ttl=8h \
    token_num_uses=10 \
    token_ttl=20m \
    token_max_ttl=30m \
    secret_id_num_uses=40;
vault read auth/approle/role/refiller/role-id;
vault write -f auth/approle/role/refiller/secret-id;

vault write auth/approle/role/cli \
    token_policies="cli" \
    secret_id_ttl=8h \
    token_num_uses=10 \
    token_ttl=20m \
    token_max_ttl=30m \
    secret_id_num_uses=40;
vault read auth/approle/role/cli/role-id;
vault write -f auth/approle/role/cli/secret-id;

fg %1;
