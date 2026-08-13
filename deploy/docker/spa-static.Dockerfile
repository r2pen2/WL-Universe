# syntax=docker/dockerfile:1
# Static CRA marketing sites — no per-site Node/Express.
# Build context: monorepo root

ARG NODE_IMAGE=node:18-bookworm-slim

FROM ${NODE_IMAGE} AS client-builder
ARG APP_DIR
ARG APP_NAME

# Optional bake-time microservice endpoints (prefer runtime wl-config.js in prod)
ARG REACT_APP_WL_CMS_URL=
ARG REACT_APP_WL_CMS_API_KEY=
ARG REACT_APP_WL_CMS_SITE=
ARG REACT_APP_WL_AUTH_URL=
ARG REACT_APP_WL_AUTH_API_KEY=
ARG REACT_APP_WL_AUTH_SITE=
ARG REACT_APP_WL_FORMS_URL=
ARG REACT_APP_WL_FORMS_API_KEY=
ARG REACT_APP_WL_FORMS_SITE=
ARG REACT_APP_SITE_MAIL_URL=
ARG REACT_APP_SITE_MAIL_API_KEY=
ARG REACT_APP_SITE_MAIL_SITE_SLUG=

ENV REACT_APP_WL_CMS_URL=$REACT_APP_WL_CMS_URL \
    REACT_APP_WL_CMS_API_KEY=$REACT_APP_WL_CMS_API_KEY \
    REACT_APP_WL_CMS_SITE=$REACT_APP_WL_CMS_SITE \
    REACT_APP_WL_AUTH_URL=$REACT_APP_WL_AUTH_URL \
    REACT_APP_WL_AUTH_API_KEY=$REACT_APP_WL_AUTH_API_KEY \
    REACT_APP_WL_AUTH_SITE=$REACT_APP_WL_AUTH_SITE \
    REACT_APP_WL_FORMS_URL=$REACT_APP_WL_FORMS_URL \
    REACT_APP_WL_FORMS_API_KEY=$REACT_APP_WL_FORMS_API_KEY \
    REACT_APP_WL_FORMS_SITE=$REACT_APP_WL_FORMS_SITE \
    REACT_APP_SITE_MAIL_URL=$REACT_APP_SITE_MAIL_URL \
    REACT_APP_SITE_MAIL_API_KEY=$REACT_APP_SITE_MAIL_API_KEY \
    REACT_APP_SITE_MAIL_SITE_SLUG=$REACT_APP_SITE_MAIL_SITE_SLUG

WORKDIR /repo/${APP_DIR}/client
COPY ${APP_DIR}/client/package*.json ./
RUN npm ci --legacy-peer-deps

WORKDIR /repo
COPY scripts ./scripts
COPY packages/web-legos ./packages/web-legos
COPY packages/server-legos ./packages/server-legos
COPY ${APP_DIR}/client ./${APP_DIR}/client

WORKDIR /repo/${APP_DIR}/client
RUN node /repo/scripts/sync-local-packages.mjs ${APP_NAME} \
  && npm run build

FROM nginx:1.27-alpine
ARG APP_DIR
COPY deploy/docker/spa-nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/docker/spa-entrypoint.sh /spa-entrypoint.sh
RUN chmod +x /spa-entrypoint.sh
COPY --from=client-builder /repo/${APP_DIR}/client/build /usr/share/nginx/html
EXPOSE 8080
CMD ["/spa-entrypoint.sh"]
