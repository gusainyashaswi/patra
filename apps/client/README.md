# Patra dashboard

The Patra dashboard is a Next.js 16 application for managing organizations, contacts, templates, sender identities, and campaigns. It uses the Express API in `../server` and relies on HTTP-only cookie sessions rather than browser-stored access tokens.

## Run locally

From the repository root, install workspace dependencies once:

```bash
npm install
```

Start the API first, then the dashboard:

```bash
npm run dev --workspace server
npm run dev --workspace client
```

Open `http://localhost:3000`.

## Environment

The client defaults to `http://localhost:5001/api`. To point it at another API, set this value before starting Next.js:

```bash
NEXT_PUBLIC_API_URL=https://api.example.com/api
```

The API must permit the dashboard origin through `CORS_ORIGIN` and support credentialed requests. Authentication routes set HTTP-only cookies; browser code must not store access or refresh tokens.

## Commands

Run these commands from `apps/client`, or add `--workspace client` at the repository root:

```bash
npm run dev      # Start the Next.js development server
npm run build    # Create the production build
npm run start    # Serve the production build
npm run lint     # Run ESLint
npm run test     # Run Node test files
```

## Main areas

- `app/login` — sign-in screen.
- `app/(app)` — authenticated dashboard routes.
- `components` — application shell, rendering, and shared UI components.
- `lib/api.js` — credentialed API client and API base URL configuration.
- `lib/*-api.js` — resource-specific API helpers.

## Production notes

Build the client with the production `NEXT_PUBLIC_API_URL`, serve it over HTTPS, and configure the server's cookie and CORS settings for the deployed dashboard origin. The API and worker deployment requirements are documented in the repository [README](../../README.md).
