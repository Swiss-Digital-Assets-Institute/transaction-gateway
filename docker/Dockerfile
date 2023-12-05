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
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm -r build
RUN pnpm deploy --filter=api-server --prod /prod/backend
RUN pnpm deploy --filter=cron --prod /prod/cron
RUN pnpm deploy --filter=cli --prod /prod/cli

FROM base AS backend
COPY --chown=node:node --from=build /prod/backend /prod/backend
USER node
WORKDIR /prod/backend
COPY --chown=node:node docker/api-server-entrypoint.sh ./
CMD ["./api-server-entrypoint.sh"]

FROM base AS cron
COPY --chown=node:node --from=build /prod/cron /prod/cron
USER node
WORKDIR /prod/cron
ENTRYPOINT ["pnpm", "launch:prod"]

FROM base AS cli
COPY --chown=node:node --from=build /prod/cli /prod/cli
USER node
WORKDIR /prod/cli
ENTRYPOINT ["tail", "-f", "/dev/null"]
