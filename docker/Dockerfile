FROM ghcr.io/swiss-digital-assets-institute/nodejs:main as base
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

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app

RUN npm install -g pnpm
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter=api-server generate
RUN pnpm --filter=api-server build
RUN pnpm deploy --filter=api-server /prod/backend

FROM base AS backend
COPY --chown=node:node --from=build /prod/backend /prod/backend
USER node

WORKDIR /prod/backend
RUN pnpm generate
COPY --chown=node:node docker/api-server-entrypoint.sh ./

CMD ["./api-server-entrypoint.sh"]