# syntax=docker/dockerfile:1

FROM node:18-bookworm-slim AS client-builder
WORKDIR /repo/packages/nicole-levin/client

COPY packages/nicole-levin/client/package*.json ./
RUN npm ci --legacy-peer-deps

WORKDIR /repo
COPY scripts ./scripts
COPY packages/web-legos ./packages/web-legos
COPY packages/server-legos ./packages/server-legos
COPY packages/nicole-levin/client ./packages/nicole-levin/client

WORKDIR /repo/packages/nicole-levin/client
RUN npm run build

FROM node:18-bookworm-slim AS server-deps
WORKDIR /repo/packages/nicole-levin

COPY packages/nicole-levin/package*.json ./
RUN npm ci --omit=dev

FROM node:18-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3005

WORKDIR /repo
COPY scripts ./scripts
COPY packages/server-legos ./packages/server-legos
COPY packages/nicole-levin ./packages/nicole-levin
COPY --from=server-deps /repo/packages/nicole-levin/node_modules ./packages/nicole-levin/node_modules
COPY --from=client-builder /repo/packages/nicole-levin/client/build ./packages/nicole-levin/client/build

RUN node scripts/sync-local-packages.mjs nicole-levin \
  && mkdir -p /repo/packages/nicole-levin/static/images /repo/packages/nicole-levin/config

WORKDIR /repo/packages/nicole-levin
EXPOSE 3005

CMD ["node", "server.js"]
