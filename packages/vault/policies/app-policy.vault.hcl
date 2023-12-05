# This section grants all access on "secret/*".
path "secret/*" {
  capabilities = ["create", "read", "update", "patch", "delete", "list"]
}