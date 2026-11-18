# Patra: Product Requirements Document

**Version:** 5.0 (MVP, single-user, MongoDB, TypeScript)
**Author:** Sarthak
**Status:** Active. Supersedes Patra-PRD v3.0 (PostgreSQL) and Patra-PRD-MongoDB v4.0.
**Companion documents:** Patra-Completion-Plan.md, Patra-Work-Split.md, Patra-TechStack.pdf, Patra-API-Endpoints.xlsx, dbms/01_normalization.md

---

## 1. Overview

Patra is a mail service platform. It lets an organization configure how its email is sent (mail provider, verified domain, sender identity), design reusable email templates on a visual canvas, import an audience from CSV or Excel, and send campaigns with per-recipient delivery tracking.

Patra does not replace email providers. It sits above them. Resend is the default provider for the MVP, with SMTP and AWS SES available behind the same adapter interface. The value Patra adds is the layer above sending: transport management, template design, audience handling, queued and rate-limited delivery, and tracking.

**MVP scope:** one owner who has full access to one organization. The data model and permission checks are designed for multiple users, but team management is not built in the MVP.

## 2. Problem

Teams that need to send email have two options, and both are weak:

- **Marketing tools** (Mailchimp, Brevo) are convenient, but they lock the team into their sending infrastructure and their data model.
- **Building it themselves** means rebuilding the same plumbing every time: provider setup, domain authentication, queueing, rate limits, template rendering, bounce handling, and delivery tracking.

Patra packages that plumbing as a self-hostable platform with a transport-agnostic core. A failed or duplicate send is treated as a serious bug, not a minor one. Most student projects skip these concerns, which is why the send engine is the centre of the design.

## 3. Goals and Non-Goals

**Goals (MVP)**

1. Configure a mail transport, test it, and verify a sender identity.
2. Design, save, publish, preview, and test-send templates.
3. Import contacts from CSV or Excel, with a preview step that writes nothing.
4. Create a campaign from a published template version and send it to an audience.
5. Send without duplicates, and survive a worker restart mid-send.
6. Track each recipient's status and show live progress.

**Non-goals (MVP)**

- Multi-user teams, invitations, and custom roles (designed for, not built).
- Platform admin console.
- Scheduled sends and trigger-based automation (post-MVP).
- SMS or other channels.
- A/B testing and advanced marketing analytics.
- Billing.
- In-app domain verification. The owner verifies the domain in the provider's dashboard for now. The Resend domain sync endpoint is a convenience, not a requirement.

## 4. Current Status

Status is based on the milestone scorecard reported by the team. It has not yet been checked file by file against the repository.

| Milestone | Status | Backend | Frontend | Remaining |
|---|---|---|---|---|
| M1: Setup, auth, transports, senders | ~95% | Done | Done | Remove `transportId` from sender identity, typed Express request, path alias, remove Prisma leftovers, `.env.example`, `.dockerignore`, transport tests |
| M2: Template designer | Partial | Models only | Canvas ready, mock data | Template API, draft save, publish, compile, preview, test send, uploads |
| M3: Contacts and suppressions | Partial | Models only | Import UI ready | Import preview and commit, suppression filter |
| M4: Campaigns and sending engine | Partial | Models only | Campaign UI ready | Queue, worker, transport adapter, send endpoints, state machine |
| M5: Webhooks and live tracking | Not started | Model only | Counters stubbed | Webhook handler, Redis pub/sub, SSE stream |
| M6: Overview and alerts | Partial | Missing | Dashboard ready | Stats and alerts endpoints, CSV export |

**Known repository differences to resolve**

- The repository history shows PostgreSQL and Prisma (pull request #6). This PRD uses MongoDB and Mongoose. The database migration must be completed, and the Prisma files removed, before M2.
- The layout in this PRD is `apps/web` and `apps/server`, which matches the restructure in pull request #7. Earlier documents used `client/` and `server/`; those are superseded.
- The README describes a working prototype (a Nodemailer sender with an Ethereal fallback and an outbox). It is not the MVP described here. Present it as the prototype the MVP grows from.

## 5. Users and Access

- **Owner (MVP):** one user with the `org_admin` role on one organization. Full access to every feature.
- **Authorization model:** every route runs `requirePermission()`. The owner passes every check. The checks stay in place so that adding members later is a data change, not a code change.
- **Future roles:** `platform_admin`, `org_admin`, `member`. Members see only their own campaigns.

## 6. Features

### 6.1 Mail Transport (M1)

- Add a transport of type SMTP, Resend, or SES. Credentials are encrypted in the application (AES-256-GCM) before they are stored. They are never returned to the client; the UI shows a masked value.
- A transport must pass a connection test before it can send.
- One default transport per organization.
- Every provider is behind one adapter interface (`send`, `verify`). Sending code never refers to a provider by name.

### 6.2 Sender Identities (M1)

- A sender identity has a display name, a From address, an optional Reply-To, and a default flag.
- The From address must belong to a domain verified for the transport. The server enforces this. The UI cannot bypass it.
- A sender identity does not store its transport directly. The transport is resolved through its domain, so the two cannot disagree.
- Campaigns reference a sender identity by ID. Free-text From fields are not allowed.

### 6.3 Template Designer (M2)

- **Canvas:** a centred email preview with blocks: text, image, button, divider, spacer. Blocks are added, reordered, selected, and edited.
- **Properties panel:** edits the selected block. With no block selected, it edits page settings: background, width, text colour, alignment, padding.
- **Top bar:** name, From (chosen from sender identities), Reply-To, subject, preview text, status (Draft or Published), Publish.
- **Storage:** the draft is a JSON block tree, saved with a one-second debounce. The server stores it without compiling.
- **Publish:** validates the blocks, extracts the variables, compiles HTML and plain text, and creates an immutable `TemplateVersion`. Version numbers come from an atomic counter.
- **Variables:** merge fields such as `{{name}}` are chosen from the variable list. Values are HTML-escaped at send time. A recipient missing a required value is marked `SKIPPED`, not sent with a blank.
- **Safety:** text blocks allow only bold, italic, links, and line breaks. Links must use http or https. Scripts and event attributes are stripped.
- **Images:** uploaded to object storage and referenced by public URL. Base64 images are not used, because email clients block them. Upload limit 5 MB; only image MIME types are accepted.
- **Preview and test send:** preview renders with sample data on the server. Test send goes to the owner's own address through the same adapter the campaigns use.

### 6.4 Audience (M3)

- Import a CSV or Excel (`.xlsx`) file. The preview step parses the file, validates every email, detects duplicates, and writes nothing.
- The preview reports valid rows, invalid rows with reasons, duplicates, and suppressed addresses. Invalid rows can be downloaded as CSV for correction.
- Commit upserts contacts by (organization, email) and creates a list. Other columns become custom fields for merge variables.
- Limits: 50,000 rows and 5 MB per file. Only the first sheet is read. Formulas are never evaluated.
- Suppressed addresses (unsubscribed, hard-bounced, complained) are excluded in every estimate and every send. The exclusion is a query, not a UI filter.

### 6.5 Campaigns and Sending (M4)

- A campaign pins a published template version, a sender identity, and a list. Later template edits never change it.
- **Estimate** shows the recipient count after suppressions and the number of recipients missing a required variable.
- **Send** is idempotent. A second send returns 409 and creates nothing. Each recipient has one row, and each row has one queue job whose ID is the recipient ID.
- **Worker** sends with a concurrency limit and a rate limit taken from the transport's real provider limit.
- **Retries:** temporary errors (timeouts, 5xx, rate limits) retry 3 times with exponential backoff, starting at 5 seconds. Permanent errors (invalid address, hard rejection) mark the recipient `FAILED` and are not retried.
- **Crash recovery:** a repeatable job every 5 minutes re-enqueues recipients that are `QUEUED`, older than 10 minutes, and have no job.
- **Pause and resume:** the worker checks the campaign status before each send, so a pause takes effect on the next job.
- **Auto-pause:** if a campaign has at least 50 sent messages and its bounce rate passes 5%, the campaign is paused and an alert is recorded.
- **Unsubscribe:** every bulk email has a link with a signed token (HMAC, with organization, email, and expiry). The public endpoint records the unsubscribe and shows the same page for valid and invalid tokens, so it cannot be used to check addresses.
- Every email has a plain-text part.

### 6.6 Delivery Tracking (M5)

- The provider calls `POST /api/webhooks/resend`. The request is verified with its Svix signature before any database write. The route is mounted before the JSON body parser, so the raw body is available for verification.
- Each event is stored in `webhookevents` with the provider's event ID. A repeated event is ignored.
- Recipient status moves forward only: `QUEUED < SENT < DELIVERED < OPENED or CLICKED`. `BOUNCED` and `COMPLAINED` are final and override other states.
- A hard bounce or complaint adds the address to suppressions and updates the campaign counters.
- **Live updates:** `GET /api/orgs/:orgId/campaigns/:id/stream` sends Server-Sent Events. Because the browser's `EventSource` cannot send an Authorization header, the page first requests a short-lived stream token (60 seconds, one campaign) and passes it in the query string. The server sends the current counters first, then updates, and a heartbeat every 15 seconds. The Redis subscription is removed when the connection closes.

### 6.7 Overview (M6)

- **Stats:** sent, delivered, bounced, failed, and pending for a selected period, from stored counters. Returns zeros when there is no data.
- **Alerts:** bounce rate above threshold, paused campaigns, unverified sender domain, failing transport.
- **Recipient export:** a CSV of one campaign's recipients, streamed from a database cursor so large campaigns do not load into memory.
- **Recent campaigns** with status.

## 7. User Flow (MVP)

1. Log in.
2. Add a mail transport and test the connection.
3. Add a sender identity on a verified domain.
4. Import contacts from CSV or Excel. Fix or download the invalid rows, then commit.
5. Design a template, autosave, send a test to yourself, and publish.
6. Create a campaign: template version, sender, list. Check the estimate.
7. Send. The page shows live progress.
8. Review each recipient's status, filter by status, and export the results.

## 8. Architecture

**Repository layout**

```
patra/
├── apps/
│   ├── web/                 # Next.js: dashboard, template designer, campaign pages
│   └── server/              # Express API and BullMQ worker
│       └── src/
│           ├── index.ts     # API entrypoint
│           ├── worker.ts    # queue worker entrypoint (separate process)
│           ├── config/      # env.ts (zod-validated environment)
│           ├── middleware/  # auth, requirePermission, validate, errors
│           ├── routes/      # one file per area
│           ├── schemas/     # zod request schemas
│           ├── services/    # business rules, state machine, render
│           ├── repositories/# all database access, always scoped by organizationId
│           ├── models/      # Mongoose schemas
│           ├── transports/  # adapter interface, resend, smtp, ses
│           ├── queue/       # BullMQ queues and Redis connection
│           └── lib/         # crypto, errors, redis, unsubscribe token
├── packages/shared/         # shared TypeScript types, enums, block schema, zod schemas
├── docker-compose.yml
├── tsconfig.base.json
└── .env.example
```

**Components**

- **Web (Next.js):** dashboard and template canvas. Calls the API through a typed client in `lib/api`.
- **API (Express):** HTTP interface. Accepts work, checks permissions and tenant ownership, and returns `202 Accepted` for sends. It never waits for mail to be delivered.
- **Worker (Node):** same code as the API, separate process and container. Pulls jobs, renders, calls the transport, and updates the database. Keeps running when the API restarts.
- **MongoDB:** system of record, accessed through Mongoose. Runs as a single-node replica set, which transactions require.
- **Redis:** BullMQ queue storage and the pub/sub channel for live updates. Pub/sub uses its own connection.
- **Resend:** default transport. SMTP (Mailtrap for load tests) and SES are later adapters.

**Language and tooling**

- TypeScript in strict mode across `apps/web`, `apps/server`, and `packages/shared`.
- Shared types and zod schemas live in `packages/shared`, so an API change breaks the build on both sides.
- Mongoose models use typed interfaces. Request types come from `z.infer`, so validation and types cannot drift.
- Environment variables are parsed with zod at startup. The process stops if one is missing.
- Production runs compiled JavaScript from `dist/`. Development uses `tsx watch`.
- Tests: Vitest and Supertest. Integration tests run against a MongoDB replica set and Redis in Docker.

**Hosting (planned):** web and API on Render or Railway, worker as a separate service, MongoDB Atlas (free tier), Upstash Redis.

## 9. Data Model (MongoDB)

| Collection | Key fields | Notes |
|---|---|---|
| `users` | email (unique), name, passwordHash, isPlatformAdmin | Owner account |
| `refreshtokens` | userId, tokenHash (unique), expiresAt, revokedAt | Hashed tokens; TTL index removes expired ones |
| `organizations` | name, slug (unique), timezone | One organization in the MVP |
| `memberships` | userId, organizationId, roleId | Unique on (userId, organizationId) |
| `roles` | organizationId (null for system roles), name, permissions[], isSystem | Permissions stored as keys |
| `mailtransports` | organizationId, type, credentialsEncrypted, ratePerSecond, dailyLimit, status, isDefault | Credentials are never selected by default |
| `domains` | organizationId, transportId, name, verified, dnsRecords | Unique on (organization, name) |
| `senderidentities` | organizationId, domainId, displayName, fromEmail, replyTo, isDefault | No `transportId`; resolved through the domain |
| `contacts` | organizationId, email, name, customFields | Unique on (organization, email) |
| `lists` | organizationId, name, contactIds[] | Moves to its own collection when lists grow large |
| `suppressions` | organizationId, email, reason | Unique on (organization, email) |
| `templates` | organizationId, name, status, draft, latestVersion | Draft autosaves here |
| `templateversions` | organizationId, templateId, version, subject, blocks, html, text, variables | Immutable; unique on (templateId, version) |
| `campaigns` | organizationId, name, status, templateVersionId, senderIdentityId, listId, counters | Counters change only with `$inc` |
| `campaignrecipients` | organizationId, campaignId, contactId, email, status, providerMessageId, error, timestamps | Unique on (campaignId, contactId); `email` is a snapshot at send time |
| `webhookevents` | provider, providerEventId (unique), type, payload, receivedAt | Expires after 30 days |
| `auditlogs` | organizationId, userId, action, targetType, targetId, metadata, createdAt | Records sends, publishes, transport and suppression changes |

**Integrity rules (MongoDB has no foreign keys)**

- The service layer checks that a campaign's template version, sender identity, and list belong to the same organization.
- A transport, domain, or list cannot be deleted while a queued or scheduled campaign uses it. Other deletes remove dependent documents in one service call.
- Every repository method requires `organizationId`.
- The counters on a campaign are changed only by the worker and the webhook handler.

The normalization analysis is in `dbms/01_normalization.md`.

## 10. API (MVP)

Organization routes sit under `/api/orgs/:orgId`. The owner is the only caller today, and the paths stay the same for multi-user later.

**Core routes (24, from the MVP list)**

| Area | Method and path |
|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me` |
| Transport | `GET, POST /api/orgs/:orgId/transports`, `POST /api/orgs/:orgId/transports/:id/test` |
| Senders | `GET, POST /api/orgs/:orgId/senders` |
| Templates | `GET, POST /api/orgs/:orgId/templates`, `GET /api/orgs/:orgId/templates/:id`, `PUT /api/orgs/:orgId/templates/:id/draft`, `POST /api/orgs/:orgId/templates/:id/publish`, `POST /api/orgs/:orgId/templates/:id/preview`, `POST /api/orgs/:orgId/templates/:id/test-send`, `POST /api/orgs/:orgId/uploads` |
| Contacts | `POST /api/orgs/:orgId/contacts/import/preview`, `POST /api/orgs/:orgId/contacts/import` |
| Campaigns | `GET, POST /api/orgs/:orgId/campaigns`, `GET /api/orgs/:orgId/campaigns/:id`, `POST /api/orgs/:orgId/campaigns/:id/send`, `GET /api/orgs/:orgId/campaigns/:id/recipients`, `GET /api/orgs/:orgId/campaigns/:id/stream` |

**Supporting routes (needed to complete the MVP, added in v5.0)**

| Area | Method and path | Why |
|---|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/logout`, `POST /api/auth/change-password` | Already built |
| Transport | `POST /api/orgs/:orgId/transports/:id/domains/sync` | Already built (Resend only) |
| Campaigns | `POST /api/orgs/:orgId/campaigns/:id/estimate` | Needed by the composer |
| Campaigns | `POST /api/orgs/:orgId/campaigns/:id/pause`, `POST /api/orgs/:orgId/campaigns/:id/resume` | Needed by auto-pause and the UI |
| Stream | `POST /api/orgs/:orgId/campaigns/:id/stream-token` | Short-lived token for `EventSource` |
| Public | `GET /api/public/unsubscribe/:token` | Required for bulk email compliance |
| Overview | `GET /api/orgs/:orgId/stats`, `GET /api/orgs/:orgId/alerts` | Replaces the earlier `/overview` name |
| Export | `GET /api/orgs/:orgId/campaigns/:id/recipients/export` | CSV export |
| Provider | `POST /api/webhooks/resend` | Provider-called, verified by signature |

The API spreadsheet marks which of these are MVP and which are implemented.

## 11. Security and Reliability

- **Tenant isolation:** every query is scoped by `organizationId`. A resource that belongs to another organization returns 404, not 403, so IDs cannot be probed.
- **Secrets:** provider credentials are encrypted before storage with a key from the environment. Never returned, never logged.
- **Authorization:** `requirePermission()` on every route. Validation with zod on params, query, and body.
- **Sender integrity:** From addresses are checked on the server against verified domains.
- **Idempotency:** send, pause, resume, and webhook processing are safe to repeat.
- **Template immutability:** campaigns pin a published version. Edits never reach queued mail.
- **Deliverability:** SPF, DKIM, and DMARC on the sending domain. Plain-text part in every email. Bounces and complaints handled automatically.
- **Compliance:** unsubscribe link in every bulk email, enforced by the sending code, not the template. Suppressions are checked in the query.
- **Signatures:** webhook requests are rejected before any write if the signature is wrong.
- **Errors:** one error type, one response shape. Stack traces are logged on the server only.
- **Audit:** sends, publishes, transport changes, and suppression changes are recorded.

## 12. Success Criteria

1. A 100-recipient campaign sends end to end. Every recipient reaches a final status.
2. Killing the worker mid-send (SIGKILL) and restarting it loses no recipients and sends no duplicates.
3. Sending the same campaign twice creates each recipient once.
4. A template edited after queueing does not change the emails already queued.
5. A From address on an unverified domain is rejected by the API.
6. A replayed webhook event changes nothing.
7. A bounce creates a suppression automatically and the address is excluded from the next send.
8. The live page reflects status changes within 2 seconds.
9. A 2,000-send load test through the Mailtrap SMTP sandbox completes without errors.
10. Docker Compose starts every service from a clean checkout.

## 13. Milestones and Definition of Done

Every milestone is done when its endpoints match the API list, permission and tenant tests pass, the frontend calls the real API (no mock data), and the endpoints are marked in the API spreadsheet.

| Milestone | Scope | Done when |
|---|---|---|
| **M1** Setup, auth, transports, senders | Cleanup (section 4), tests for transports | `npm test` passes; `tsc --noEmit` passes in both apps; Compose starts |
| **M2** Template designer | Block schema in `packages/shared`, template endpoints, compile, sanitize, upload, test send | A template can be created, edited, published, previewed, and test-sent to the owner, with no mock data |
| **M3** Contacts and suppressions | Import preview and commit, suppression filter | A real Excel file can be previewed and imported; suppressed addresses are excluded from counts |
| **M4** Campaigns and sending engine | State machine, send, worker, Resend adapter, reconciliation, unsubscribe, auto-pause | 100 recipients sent through the fake transport and through the owner's addresses on Resend, with correct counters and no duplicates |
| **M5** Webhooks and live tracking | Webhook handler, forward-only status, suppression on bounce, SSE stream and token | A live campaign page updates during a send; a real Resend bounce appears in the table and the suppression list |
| **M6** Overview and alerts | Stats, alerts, recipient CSV export | Dashboard shows real numbers; export opens correctly in Excel |
| **Final** Deployment and demo | Dockerfiles, Compose, documentation, demo | Clean checkout starts with one command; documents match the code; demo recorded |

**Post-MVP:** domain verification flow in the app, scheduled sends, trigger-based automation, team roles and invitations, audit log UI, platform admin console.

## 14. Testing Strategy

| Level | Covers | Tools |
|---|---|---|
| Unit | Encryption, state machine, rendering, variable checks, status ranking, unsubscribe token, HTML sanitizing | Vitest |
| Integration | Each endpoint: authentication, permissions, tenant isolation, validation | Vitest, Supertest, MongoDB replica set, Redis |
| Queue | Send flow, retries, crash recovery, idempotency, pause | Vitest with a fake transport |
| Load | 2,000 queued sends | Mailtrap SMTP sandbox |
| Manual | Real Resend send, real webhook | Resend dashboard, ngrok for local webhooks |

Unit and integration tests run on every commit. Queue and load tests run before each milestone is marked done.

## 15. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Worker bug causes duplicate emails | High | Idempotency gate, job ID equal to recipient ID, kill-and-restart test |
| Resend free tier limit (100 per day) during testing | Medium | Use the fake transport and Mailtrap; use Resend for final checks only |
| Webhook signature issues block tracking | Medium | Test with a real Resend webhook early, through ngrok |
| SSE connections leak | Medium | Unsubscribe on close; test with many open tabs |
| Mail client rendering differences | Medium | Use a tested compiler; check in a preview tool |
| Scope creep (team roles, scheduling) | High | Keep them in the post-MVP list until the demo works |
| Repository still on Prisma and PostgreSQL | High | Complete the migration to Mongoose before M2 |
| Free MongoDB storage limit | Low | Monitor recipient volume; TTL on webhook events |

## 16. Open Questions

1. Which sending domain will the owner verify for the demo?
2. Which default transport for the demo: Resend or Brevo?
3. Should the template editor support multi-column layouts in the first release, or single-column stacks only?
4. Should lists move to their own collection now, or after the MVP?

## 17. Changes from Version 4.0

- Milestones, status, and definition of done are taken from the completion plan.
- Layout changed to `apps/web` and `apps/server`, matching the repository.
- Added the supporting routes the completion plan requires: estimate, pause, resume, stream token, unsubscribe, stats and alerts, export.
- Added the sending-engine rules: reconciliation, auto-pause, forward-only status, and retry classification.
- Added a current-status section and noted the repository differences.
- Added a testing strategy and a risk table.
