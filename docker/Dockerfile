FROM ghcr.io/swiss-digital-assets-institute/nodejs:main as backend

# ENV NODE_ENV production

ARG UID=1000

RUN useradd --home /node --no-log-init --create-home -Uu ${UID} -s /bin/bash node && \
  mkdir /app && \
  chown -R node:node /app

RUN microdnf install --nodocs -y \
  wget \
  make \
  g++ \
  python3 && \
  npm install -g pnpm && \
  microdnf clean all

ENV LANG=C.UTF-8

USER node 
WORKDIR /app

COPY --chown=node:node package*.json docker/docker-entrypoint.sh /app/

RUN pnpm install

COPY --chown=node:node ./ /app/

RUN pnpm run generate && \
  pnpm run build

CMD ["./docker-entrypoint.sh"]