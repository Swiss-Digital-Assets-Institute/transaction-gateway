source ./deploy/env.sh
source deploy/venv/bin/activate
mkdir -p out && ./deploy/pelm.py \
--app-name app \
--services notarization-api,transaction-gateway-api,transaction-gateway-cron,transaction-gateway-cli \
--env dev \
--registry ghcr.io/swiss-digital-assets-institute/ \