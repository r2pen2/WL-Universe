# syntax=docker/dockerfile:1
# Server-only Node/Express apps (no React client build).

ARG NODE_IMAGE=node:18-bookworm-slim

FROM ${NODE_IMAGE} AS deps
ARG APP_DIR

WORKDIR /repo/${APP_DIR}
COPY ${APP_DIR}/package*.json ./
RUN npm install --omit=dev --ignore-scripts

FROM ${NODE_IMAGE} AS runtime
ARG APP_DIR
ARG APP_NAME
ARG PORT=3020

ENV NODE_ENV=production
ENV PORT=${PORT}

WORKDIR /repo/${APP_DIR}
COPY ${APP_DIR} ./
COPY --from=deps /repo/${APP_DIR}/node_modules ./node_modules

EXPOSE ${PORT}

CMD ["node", "server.js"]
