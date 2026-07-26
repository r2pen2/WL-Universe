# syntax=docker/dockerfile:1

ARG NODE_IMAGE=node:18-bookworm-slim

FROM ${NODE_IMAGE} AS client-builder
ARG APP_DIR

WORKDIR /repo/${APP_DIR}/client
COPY ${APP_DIR}/client/package*.json ./
RUN npm ci --legacy-peer-deps

WORKDIR /repo
COPY scripts ./scripts
COPY packages/web-legos ./packages/web-legos
COPY packages/server-legos ./packages/server-legos
COPY ${APP_DIR}/client ./${APP_DIR}/client

WORKDIR /repo/${APP_DIR}/client
RUN npm run build

FROM ${NODE_IMAGE} AS server-deps
ARG APP_DIR

WORKDIR /repo/${APP_DIR}
COPY ${APP_DIR}/package*.json ./
RUN npm install --omit=dev --ignore-scripts

FROM ${NODE_IMAGE} AS runtime
ARG APP_DIR
ARG APP_NAME
ARG PORT=3000

ENV NODE_ENV=production
ENV PORT=${PORT}

WORKDIR /repo
COPY scripts ./scripts
COPY packages/web-legos ./packages/web-legos
COPY packages/server-legos ./packages/server-legos
COPY ${APP_DIR} ./${APP_DIR}
COPY --from=server-deps /repo/${APP_DIR}/node_modules ./${APP_DIR}/node_modules
COPY --from=client-builder /repo/${APP_DIR}/client/build ./${APP_DIR}/client/build

RUN node scripts/sync-local-packages.mjs ${APP_NAME} \
  && mkdir -p /repo/${APP_DIR}/static/images /repo/${APP_DIR}/images /repo/${APP_DIR}/config

WORKDIR /repo/${APP_DIR}
EXPOSE ${PORT}

CMD ["node", "server.js"]
