vault policy write executor ./policies/executor-policy.vault.hcl
vault policy write refiller ./policies/refiller-policy.vault.hcl
vault policy write cli ./policies/cli-policy.vault.hcl
vault auth enable approle;

vault write auth/approle/role/executor \
    token_policies="executor" \
    secret_id_ttl=0 \
    token_num_uses=0 \
    token_ttl=0 \
    token_max_ttl=0 \
    secret_id_num_uses=0;
vault read auth/approle/role/executor/role-id;
vault write -f auth/approle/role/executor/secret-id;

vault write auth/approle/role/refiller \
    token_policies="refiller" \
    secret_id_ttl=0 \
    token_num_uses=0 \
    token_ttl=0 \
    token_max_ttl=0 \
    secret_id_num_uses=0;
vault read auth/approle/role/refiller/role-id;
vault write -f auth/approle/role/refiller/secret-id;

vault write auth/approle/role/cli \
    token_policies="cli" \
    secret_id_ttl=0 \
    token_num_uses=0 \
    token_ttl=0 \
    token_max_ttl=0 \
    secret_id_num_uses=0;
vault read auth/approle/role/cli/role-id;
vault write -f auth/approle/role/cli/secret-id;
vault secrets enable -path=secret kv-v2;