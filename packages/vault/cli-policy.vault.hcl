path "secret/data/refiller*" {
  capabilities = ["create", "read", "update", "patch", "list"]
}

path "secret/data/executor*" {
  capabilities = ["create", "read", "update", "patch", "list"]
}

path "secret/metadata/refiller*" {
  capabilities = ["delete"]
}

path "secret/metadata/executor*" {
  capabilities = ["delete"]
}