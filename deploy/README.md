# Deploy

This folder holds shared deployment building blocks.

- `docker/node-react-express.Dockerfile` builds apps that have an Express server at the package root and a React client in `client/`.
- `compose/*.yml` contains app-level compose templates. Host-specific paths should be passed with environment variables or left as defaults in the deploy host's service directory.

Future apps should reuse the shared Dockerfile when they follow the same shape as NicoleLevin.
