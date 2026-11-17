# Patra: Completion Plan

**Project:** Patra, a multi-tenant mail service platform
**Stack:** Next.js (client), Express + TypeScript (server), MongoDB (Mongoose), Redis (BullMQ and pub/sub), Docker Compose
**Goal:** finish the MVP defined in the PRD, with a working end-to-end send flow, a live dashboard, and a deployable Docker setup.

---

## 1. Current Status

| Milestone                            | Status      | Backend     | Frontend                | Remaining work                             |
| ------------------------------------ | ----------- | ----------- | ----------------------- | ------------------------------------------ |
| M1: Setup, auth, transports, senders | ~95%        | Done        | Done                    | Cleanup items in Phase 0                   |
| M2: Template designer and versioning | Partial     | Models only | Canvas ready, mock data | API, publish, rendering, test send         |
| M3: Contacts import and suppressions | Partial     | Models only | Import UI ready         | Preview and commit API, suppression filter |
| M4: Campaigns and sending engine     | Partial     | Models only | Campaign UI ready       | Queue, worker, transport adapter, send API |
| M5: Webhooks and live tracking       | Not started | Model only  | Counters stubbed        | Webhook handler, Redis pub/sub, SSE        |
| M6: Overview and alerts              | Partial     | Missing     | Dashboard ready         | Stats API, alerts, CSV export              |

**Definition of done for every milestone**

- The endpoints work and return the response shapes in the API list.
- Permission and tenant checks are covered by tests.
- The frontend calls the real API. No screen reads from `lib/mock.js`.
- The endpoint appears in the API spreadsheet with its MVP flag set.

---

## 2. Corrections to Existing Docs

These differences must be resolved before the final submission, so the documents match the code.

| Topic              | PRD says                      | Code/status says                       | Decision                                                                        |
| ------------------ | ----------------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| Folder layout      | `client/` and `server/`       | `apps/web`, `apps/server`, Turborepo   | Pick one. The code uses `apps/`, so update the PRD and docker-compose to match. |
| Worker path        | `server/src/worker.ts`        | `apps/server/src/worker.ts`            | Follow the chosen layout.                                                       |
| Overview endpoints | `/stats`, `/alerts`, `/usage` | `/overview`                            | Use `/stats` and `/alerts`. Update the frontend call.                           |
| Extra auth routes  | login, refresh, me            | also register, logout, change-password | Keep them. Add them to the API list.                                            |
| Domain sync        | not in PRD                    | `/transports/:id/domains/sync`         | Keep it. It is Resend-specific, so note that in the adapter.                    |
| SenderIdentity     | `transportId` removed         | still present                          | Remove it (Phase 0).                                                            |

---

## 3. Phase 0: Cleanup (1 to 2 days)

Finish M1 properly before starting M2.

- [ ] Remove `transportId` from `SenderIdentity`. Resolve the transport through `domainId`. Update the sender service and the `/senders` response.
- [ ] Add `server/src/types/express.d.ts` so `req.user` is typed.
- [ ] Set the `@patra/shared` path alias in both `tsconfig.json` files and in the test runner config.
- [ ] Delete the `prisma/` folder and any Prisma dependencies.
- [ ] Add `.env.example` to `server/` and `client/` with every variable listed in `env.ts`.
- [ ] Add `.dockerignore` (`node_modules`, `dist`, `.next`, `.env`).
- [ ] Set up Vitest and Supertest. Add a test helper that starts a MongoDB replica set in memory (`MongoMemoryReplSet`) and a Redis instance for queue tests.
- [ ] Write the first tests for transports: auth missing (401), create with no credentials in response, another org's ID returns 404, invalid body returns 400.
- [ ] Align the folder names and paths (section 2).

**Done when:** `npm test` passes, `tsc --noEmit` passes in both apps, and `docker compose up` starts with no errors.

---

## 4. Phase 1: M2, Template Designer (1.5 weeks)

### 4.1 Shared block schema

Put the block types in `shared/blocks.ts`. The canvas and the server both use them, so a block that the editor saves is always one the compiler can read.

```
Block = Text | Image | Button | Divider | Spacer
PageSettings = { background, width, textColor, align, padding }
TemplateDraft = { subject, previewText, page, blocks[] }
```

### 4.2 Server files

| File                            | Responsibility                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `schemas/template.schema.ts`    | zod schemas for create, draft save, publish, preview, test-send                              |
| `repositories/template.repo.ts` | All template and version queries, always with `organizationId`                               |
| `services/template.service.ts`  | Draft save, publish, preview, test-send                                                      |
| `services/render/compile.ts`    | Blocks to email HTML (React Email or MJML) and plain text                                    |
| `services/render/variables.ts`  | Extract `{{variable}}` names and check them against a list                                   |
| `services/render/sanitize.ts`   | Allow only bold, italic, link, and line break in text blocks; allow only http and https URLs |
| `routes/templates.routes.ts`    | The template endpoints                                                                       |
| `routes/uploads.routes.ts`      | Image upload (multer, 5 MB limit, MIME and extension check)                                  |

### 4.3 Endpoints to build (from the MVP list)

- [ ] `GET /api/orgs/:orgId/templates`
- [ ] `POST /api/orgs/:orgId/templates`
- [ ] `GET /api/orgs/:orgId/templates/:id`
- [ ] `PUT /api/orgs/:orgId/templates/:id/draft`
- [ ] `POST /api/orgs/:orgId/templates/:id/publish`
- [ ] `POST /api/orgs/:orgId/templates/:id/preview`
- [ ] `POST /api/orgs/:orgId/templates/:id/test-send`
- [ ] `POST /api/orgs/:orgId/uploads`

### 4.4 Publish logic

1. Validate the draft against the block schema.
2. Extract the variables and reject any that are not allowed.
3. Compile to HTML and text.
4. Increment `latestVersion` with `findOneAndUpdate` and `$inc`, and use the new value as the version number. The unique index on `(templateId, version)` stops two publishes from taking the same number.
5. Insert the `TemplateVersion` document. It is never updated afterwards.
6. Set the template status to `PUBLISHED`.

### 4.5 Test send

Build the Resend adapter now, with only a `send()` method, so test-send and the M4 worker share the same code. Use your own address for every test.

### 4.6 Frontend

- [ ] Replace `lib/mock.js` with calls to a typed API client in `lib/api/templates.ts`.
- [ ] Save the draft on a 1-second debounce.
- [ ] Show the publish result and the version number.
- [ ] Render the preview from the server response, so client and server output are the same.

### 4.7 Tests

- [ ] Compile each block type and check the output contains the expected HTML.
- [ ] Publishing twice gives versions 1 and 2, and version 1 does not change.
- [ ] Unknown variable is rejected.
- [ ] `<script>` in a text block is removed.
- [ ] `javascript:` link is rejected.

**Done when:** a template can be created, edited, published, previewed, and test-sent to your own address, with no mock data on the screen.

---

## 5. Phase 2: M3, Contacts and Suppressions (1 week)

### 5.1 Server files

| File                               | Responsibility                                        |
| ---------------------------------- | ----------------------------------------------------- |
| `services/contactImport.ts`        | Parse CSV and Excel, validate emails, find duplicates |
| `repositories/contact.repo.ts`     | Bulk upsert by `(organizationId, email)`              |
| `repositories/suppression.repo.ts` | Lookup of suppressed emails for an organization       |
| `routes/contacts.routes.ts`        | Import preview and commit                             |

### 5.2 Endpoints

- [ ] `POST /api/orgs/:orgId/contacts/import/preview` (multipart file, no writes)
- [ ] `POST /api/orgs/:orgId/contacts/import` (commit a validated set of rows)

### 5.3 Import rules

- Read only the first sheet of an `.xlsx`, or the CSV content. Reject other file types.
- Limit to 50,000 rows and 5 MB.
- Find the email column by header name. Fall back to the first cell that contains `@`.
- Put every other column into `customFields`.
- Duplicates within the file are reported in the preview and counted once on commit.
- Emails on the suppression list are reported as skipped.
- Commit creates the contacts with `bulkWrite` and one `upsert` per row, then creates a `List` with the contact IDs.
- Never parse formulas. Read the stored values only.

### 5.4 Suppression

- Campaign estimate and send both filter out suppressed emails in one query, not in the frontend.
- A suppression can be added or removed by the owner. Each change writes an `AuditLog` entry.

### 5.5 Frontend

- [ ] Preview table with valid, invalid, and duplicate counts.
- [ ] Download invalid rows as CSV.
- [ ] Import button is disabled when there are zero valid rows.

### 5.6 Tests

- [ ] A 1,000-row CSV imports in under 5 seconds.
- [ ] Duplicate emails in one file are counted once.
- [ ] A suppressed address is excluded from the import count.
- [ ] A file with the wrong extension is rejected with 400.

**Done when:** a real Excel file can be previewed and imported, and the suppressed addresses are excluded from later counts.

---

## 6. Phase 3: M4, Campaigns and Sending Engine (1.5 weeks)

This is the core of the project. Build it in this order so you can test each piece alone.

### 6.1 Build order

1. **Transport interface.** `transports/transport.interface.ts` with `send(message) → { providerMessageId }` and `verify()`. Errors are classified as `TransientError` or `PermanentError`.
2. **Fake transport.** Records messages in memory and can be told to fail. Used for every test in this phase.
3. **Render service.** Merge variables, escape values, add the unsubscribe footer, and produce the text part.
4. **Campaign state machine.** One function that allows only valid transitions: `DRAFT → QUEUED → SENDING → COMPLETED`, plus `SENDING ⇄ PAUSED` and `→ CANCELLED`. Every status change goes through it.
5. **Send endpoint.** Creates recipients and jobs.
6. **Worker.** Processes jobs.
7. **Real adapters.** Resend first, then SMTP (Mailtrap for load tests), then SES later.

### 6.2 Files

| File                                                  | Responsibility                                                               |
| ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| `queue/send.queue.ts`                                 | BullMQ queue and Redis connection (`REDIS_URL`)                              |
| `lib/redis.ts`                                        | Shared connection factory. Pub/sub needs its own connection.                 |
| `worker.ts`                                           | Worker entrypoint: concurrency, rate limit, event logging, graceful shutdown |
| `processors/sendEmail.processor.ts`                   | Per-recipient job logic                                                      |
| `services/campaign.service.ts`                        | Create, update draft, estimate                                               |
| `services/send.service.ts`                            | Send: create recipients, enqueue jobs                                        |
| `services/campaignState.ts`                           | The state machine                                                            |
| `services/render/unsubscribe.ts`                      | Signed unsubscribe token (HMAC)                                              |
| `routes/campaigns.routes.ts`                          | Campaign endpoints                                                           |
| `routes/unsubscribe.routes.ts`                        | Public unsubscribe endpoint (added for compliance)                           |
| `transports/resend.transport.ts`, `smtp.transport.ts` | Adapters                                                                     |

### 6.3 Endpoints

- [ ] `GET /api/orgs/:orgId/campaigns`
- [ ] `POST /api/orgs/:orgId/campaigns` (pins template version, sender, and list)
- [ ] `GET /api/orgs/:orgId/campaigns/:id`
- [ ] `POST /api/orgs/:orgId/campaigns/:id/estimate` (recommended, needed for the UI)
- [ ] `POST /api/orgs/:orgId/campaigns/:id/send`
- [ ] `POST /api/orgs/:orgId/campaigns/:id/pause` and `resume`
- [ ] `GET /api/orgs/:orgId/campaigns/:id/recipients`
- [ ] `GET /api/public/unsubscribe/:token` (public, signed token)

### 6.4 Send flow

1. Check permission and tenant ownership of the campaign.
2. Move the campaign from `DRAFT` to `QUEUED` with a conditional update (`status: "DRAFT"` in the filter). If nothing matched, return 409. This is the idempotency gate.
3. Build the audience: list members, minus suppressed emails, minus contacts missing a required variable (these become `SKIPPED`).
4. `insertMany` recipients with `ordered: false`. Ignore duplicate-key errors on `(campaignId, contactId)`.
5. Set `counters.totalRecipients`.
6. Add one job per recipient to BullMQ, with `jobId = recipientId`.
7. Return `202 Accepted`.

If the process crashes between steps 4 and 6, the reconciliation job (6.6) finds `QUEUED` recipients with no job and enqueues them.

### 6.5 Worker, per job

1. Load recipient, campaign, pinned template version, sender identity, domain, and transport.
2. If the recipient is in a final status, or the campaign is paused or cancelled, stop and do nothing.
3. Render subject, HTML, and text with that recipient's data.
4. Call `transport.send()`. Save `providerMessageId`, set status `SENT`, `$inc` `sentCount`.
5. On `TransientError`, throw so BullMQ retries (3 attempts, exponential backoff starting at 5 s).
6. On `PermanentError`, set status `FAILED`, save the error text, `$inc` `failedCount`, and do not retry.
7. Publish a `recipient.updated` event to Redis.

**Worker settings:** concurrency 5. Rate limiter is taken from `transport.ratePerSecond`. Set this to the provider's real limit, not a guess.

### 6.6 Reconciliation job

A repeatable BullMQ job every 5 minutes. It finds recipients that are `QUEUED`, older than 10 minutes, and have no job in the queue, then enqueues them. This is what makes a crash mid-send safe.

### 6.7 Auto-pause on bad bounce rate

After each bounce or complaint, if the campaign has at least 50 sent messages and the bounce rate is above 5%, set the campaign to `PAUSED` and publish an alert. The worker checks the campaign status before each send, so the pause takes effect on the next job.

### 6.8 Unsubscribe

- Every bulk email carries a link with a signed token. The token holds the organization ID, the email, and an expiry, and is signed with an HMAC key from the environment.
- The public endpoint adds the email to `suppressions` with reason `UNSUBSCRIBED`. It always returns the same page, whether the token is valid or not, so it cannot be used to probe addresses.

### 6.9 Tests (the most important ones)

- [ ] Sending the same campaign twice creates recipients only once (second call returns 409).
- [ ] Kill the worker process (SIGKILL) during a 100-recipient send. Restart it. Every recipient reaches a final status, and no recipient is sent twice.
- [ ] Editing a template after the campaign is queued does not change the emails that are sent.
- [ ] A suppressed address is never sent.
- [ ] A missing merge variable marks the recipient `SKIPPED`.
- [ ] A transient error retries; a permanent error does not.
- [ ] Pausing stops new sends within one job.

**Done when:** a 100-recipient campaign goes out through the fake transport and through your own addresses on Resend, with correct counters and no duplicates.

---

## 7. Phase 4: M5, Webhooks and Live Tracking (1 week)

### 7.1 Webhook handler

- [ ] `POST /api/webhooks/resend`. Mount this route **before** `express.json()`, and use the raw body, because signature verification needs the exact bytes.
- [ ] Verify the Svix signature. Return 401 and write nothing if it fails.
- [ ] Insert into `webhookevents`. A duplicate key means the event was already applied, so return 200 and stop.
- [ ] Find the recipient by `providerMessageId`.
- [ ] Move status forward only, using a rank table (`QUEUED < SENT < DELIVERED < OPENED/CLICKED`). `BOUNCED` and `COMPLAINED` are terminal and override the others.
- [ ] On `BOUNCED` (hard) or `COMPLAINED`, upsert a suppression and `$inc` the counter.
- [ ] Publish `recipient.updated` and `campaign.counters` to Redis.

### 7.2 Live stream (SSE)

- [ ] `GET /api/orgs/:orgId/campaigns/:id/stream`
- [ ] **Authentication:** the browser `EventSource` API cannot send an `Authorization` header. Issue a short-lived stream token (60 seconds, single campaign) from an authenticated endpoint, and pass it as a query parameter.
- [ ] Set `Content-Type: text/event-stream`, `Cache-Control: no-cache`, and `Connection: keep-alive`.
- [ ] Use a separate Redis subscriber connection. Subscribe to `campaign:{id}`.
- [ ] Send a heartbeat comment every 15 seconds.
- [ ] Unsubscribe and end the response on `req.on("close")`.
- [ ] Send the current counters as the first event, so a reconnecting page does not miss updates.

### 7.3 Frontend

- [ ] A `useCampaignStream(id)` hook that opens `EventSource` and refreshes counters.
- [ ] After a reconnect, refetch the full campaign so no update is lost.

### 7.4 Tests

- [ ] A replayed webhook event changes nothing.
- [ ] An invalid signature returns 401 and writes nothing.
- [ ] A `delivered` event arriving after `bounced` does not change the status.
- [ ] A bounce adds the address to suppressions.
- [ ] The SSE stream sends events for a status change within 2 seconds.
- [ ] Closing the browser tab removes the Redis subscription.

**Done when:** the campaign page updates live during a send and a real bounce from Resend shows up in the table and the suppression list.

---

## 8. Phase 5: M6, Overview and Alerts (4 to 5 days)

### 8.1 Endpoints

- [ ] `GET /api/orgs/:orgId/stats?from=&to=`: sums the campaign counters for campaigns that were active in the period.
- [ ] `GET /api/orgs/:orgId/alerts`: returns bounce rate above 5%, paused campaigns, unverified domains, and failing transports.
- [ ] `GET /api/orgs/:orgId/campaigns/:id/recipients/export`: streams a CSV. Use a Mongo cursor, not `find()`, so a large campaign does not load into memory.

### 8.2 Rules

- Counters come from the stored totals. Do not count recipient rows on every dashboard request.
- The stats endpoint uses a date filter and returns zero, not an error, when there is no data.
- Alerts are computed on request. Do not store them in a separate collection for the MVP.

### 8.3 Frontend

- [ ] Replace mock data on `/dashboard` with the stats and alerts endpoints.
- [ ] Time range buttons (24h, 7d, 30d) change the query, not the client-side data.

### 8.4 Tests

- [ ] Stats for a period with no campaigns returns zeros.
- [ ] Export of 10,000 recipients completes without loading everything into memory.
- [ ] A bounce rate of exactly 5% does not trigger the alert, and 6% does.

**Done when:** the dashboard shows real numbers, and the CSV export opens correctly in Excel.

---

## 9. Phase 6: Deployment, Documentation, and Demo (4 to 5 days)

### 9.1 Docker

- [ ] `client`, `server`, and `worker` each have a multi-stage Dockerfile.
- [ ] `docker-compose.yml` runs client, server, worker, MongoDB (replica set), and Redis.
- [ ] A one-time `mongo-init` step runs `rs.initiate()`.
- [ ] `docker-compose.dev.yml` mounts source and runs `tsx watch`.

### 9.2 Hosting (optional but recommended for the demo)

- Client and server on Render or Railway. The worker runs as a separate service.
- MongoDB Atlas (free tier). Upstash for Redis.
- Set the Resend domain to a domain you own, and verify SPF, DKIM, and DMARC.

### 9.3 Documentation to update

- [ ] PRD: fix the corrections in section 2.
- [ ] API spreadsheet: mark implemented endpoints, add the extra auth and domain routes.
- [ ] README: setup, environment variables, how to run tests, architecture diagram.
- [ ] Normalization report: update after the `SenderIdentity` fix.
- [ ] Short demo script: create a transport, a sender, a template, import an Excel file, send a campaign, and show the live counters.

### 9.4 Demo checklist

- [ ] Record a 3-minute screen capture of the full flow.
- [ ] Show the kill-and-restart test for the worker.
- [ ] Show a bounce from Resend appearing in the suppression list.

---

## 10. Testing Strategy

| Level       | What                                                                              | Tools                                           |
| ----------- | --------------------------------------------------------------------------------- | ----------------------------------------------- |
| Unit        | Encryption, state machine, render, variable check, status rank, unsubscribe token | Vitest                                          |
| Integration | Each endpoint with auth, permissions, tenant isolation, and validation            | Vitest + Supertest + MongoMemoryReplSet + Redis |
| Queue       | Send flow, retries, crash recovery, idempotency                                   | Vitest with the fake transport                  |
| Load        | 2,000 queued sends                                                                | Mailtrap SMTP sandbox                           |
| Manual      | Real Resend send to your own addresses, real webhook                              | Resend dashboard, ngrok for local webhooks      |

Run unit and integration tests on every commit. Run the queue and load tests before each milestone is marked done.

---

## 11. Timeline (estimate, part-time)

| Phase | Work                    | Estimate          |
| ----- | ----------------------- | ----------------- |
| 0     | Cleanup, test setup     | 2 days            |
| 1     | M2 Templates            | 1.5 weeks         |
| 2     | M3 Contacts             | 1 week            |
| 3     | M4 Campaigns and worker | 1.5 weeks         |
| 4     | M5 Webhooks and SSE     | 1 week            |
| 5     | M6 Overview             | 5 days            |
| 6     | Docker, docs, demo      | 5 days            |
|       | **Total**               | **about 6 weeks** |

Estimates assume about 2 to 3 hours a day. Phase 3 is the riskiest part, so leave a buffer there.

---

## 12. Risks and Mitigations

| Risk                                                   | Impact | Mitigation                                                                  |
| ------------------------------------------------------ | ------ | --------------------------------------------------------------------------- |
| Worker bugs cause duplicate emails                     | High   | Idempotency gate, `jobId = recipientId`, and the kill-and-restart test      |
| Resend free tier (100 per day) runs out during testing | Medium | Test with the fake transport and Mailtrap; use Resend only for final checks |
| Webhook signature errors block tracking                | Medium | Test with a real Resend webhook early, using ngrok                          |
| SSE connections leak                                   | Medium | Unsubscribe on close; test with many open tabs                              |
| Template rendering differs across mail clients         | Medium | Use the compile library's tested output; test in a preview tool             |
| Scope creep (team roles, scheduling)                   | High   | Keep them in the post-MVP list. Do not start them before the demo works.    |
| Mongo free tier storage limit                          | Low    | Monitor recipient volume; TTL on webhook events                             |

---

## 13. Final Checklist

- [ ] All 24 MVP endpoints implemented and tested
- [ ] No mock data in the frontend
- [ ] Worker kill-and-restart test passes
- [ ] Idempotent send test passes
- [ ] Live counters update during a send
- [ ] Bounce creates a suppression automatically
- [ ] Docker Compose starts all services from a clean checkout
- [ ] PRD, API spreadsheet, README, and normalization report match the code
- [ ] Demo recorded
