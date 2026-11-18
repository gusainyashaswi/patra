# Patra

Patra is a multi-tenant email campaign application. The Next.js dashboard creates audiences, templates, sender identities, and campaigns; the Express API and BullMQ worker perform secure, asynchronous delivery.

## Workspace layout

```
patra/
├── apps/
│   ├── client/          # Next.js 16 dashboard
│   └── server/          # Express API, worker, queue processors, and Vitest tests
├── packages/
│   └── shared/          # Shared enums and TypeScript types
├── docker-compose.yaml  # Redis and single-node MongoDB replica set, API, and worker
└── turbo.json           # Workspace task graph
```

## Prerequisites

- Node.js 22 or later
- npm 10 or later
- MongoDB replica set (required for transactions)
- Redis (required by BullMQ)
- A configured Resend transport for real email delivery

For local container dependencies, install Docker and use the supplied Compose stack. It initializes MongoDB as the `rs0` replica set.

## Setup

Install dependencies from the repository root:

```bash
npm install
```

Copy the server environment template and set real secrets. Do not use the placeholder values:

```bash
cp apps/server/.env.example apps/server/.env
```

At a minimum, configure `MONGODB_URI`, `REDIS_URL`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, and `CREDENTIALS_KEY`. For email delivery, also configure a Resend transport through the application. See [apps/server/.env.example](apps/server/.env.example) for optional webhook and object-storage settings.

Start the API and dashboard in separate terminals:

```bash
npm run dev --workspace server
npm run dev --workspace client
```

The dashboard runs at `http://localhost:3000`; the API defaults to `http://localhost:5001`.

Run the background worker separately when testing campaign delivery:

```bash
npx tsx apps/server/src/worker.ts
```

## Common commands

```bash
npm run build                 # Build all workspaces through Turbo
npm run test                  # Run workspace test commands
npm run lint                  # Run workspace lint commands
npm run build --workspace server
npm run test --workspace server
npm run lint --workspace client
```

The integration suite runs MongoDB in memory. For Redis, it first uses `TEST_REDIS_URL` (or `REDIS_URL`) when that server is reachable; otherwise it starts Redis through Testcontainers. This means Docker is optional when you already have Redis running, for example: `TEST_REDIS_URL=redis://localhost:6379 npm test`.

## Architecture

- **Client:** Next.js dashboard using HTTP-only cookie sessions.
- **API:** Express API for authenticated organization resources and public webhook/unsubscribe endpoints.
- **Worker:** BullMQ consumers that render and deliver campaign messages.
- **MongoDB:** system of record; the Compose configuration runs it as a single-node replica set for transaction support.
- **Redis:** BullMQ queue storage and scheduling.
- **Resend:** current campaign delivery provider; delivery webhooks are Svix-verified at `POST /api/webhooks/resend`.
- **Object storage:** uploaded template images are stored in an S3-compatible bucket; MongoDB keeps only image metadata and object keys.

## Operational notes

- Configure `RESEND_WEBHOOK_SECRET` before enabling the Resend webhook endpoint.
- Configure the `S3_*` variables before enabling image uploads.
- The Compose file expects production secrets to be supplied through the environment; never commit `.env` files or credentials.
- Redis and the API expose Compose health checks; API and worker containers restart automatically after failures and wait for Redis health plus replica-set initialization.
- To remove the obsolete sender-level transport field from an existing database, run:

  ```bash
  npm run migrate:sender-transport-id --workspace server
  ```
