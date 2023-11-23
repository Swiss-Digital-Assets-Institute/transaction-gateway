path "secret/refiller/*" {
  capabilities = ["create", "read", "update", "patch", "delete", "list"]
}

path "secret/executor/*" {
  capabilities = ["create", "read", "update", "patch", "delete", "list"]
}