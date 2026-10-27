# Patra: Product Requirements Document

**Version:** 3.0 (MVP, single-user)
**Author:** Sarthak
**Status:** Final draft for build

---

## 1. Overview

Patra is a mail service platform for managing mail transport and designing reusable email templates. An organization configures how its mail is sent (provider, verified domain, sender identity), designs templates on a visual canvas, imports an audience, and sends campaigns with per-recipient delivery tracking.

Patra sits on top of email providers (Resend for the MVP, SMTP and AWS SES as alternatives) rather than replacing them. Its value is the layer above sending: transport abstraction, template design, audience management, queued delivery, and tracking.

**MVP scope:** one user who owns one organization. Multi-user roles and permissions are designed into the data model but not exposed in the MVP.

## 2. Problem

Teams that need to send email either pick a marketing tool that locks them into its infrastructure and data model, or build the same plumbing from scratch each time: provider setup, domain verification, queueing and rate limits, template rendering, and delivery tracking. Patra packages that plumbing as a self-hostable platform with a transport-agnostic core.

## 3. Goals and Non-Goals

**Goals (MVP)**
- Configure a mail transport and verify a sender identity.
- Design, save, publish, and test-send templates on a visual canvas.
- Import contacts from CSV with validation.
- Create a campaign from a published template version and send it to an audience.
- Track each recipient's status and show live progress.

**Non-goals (MVP)**
- Multi-user teams, invitations, and custom roles (designed for, not built).
- Platform admin console.
- Automated trigger-based sends (scheduled reminders, event rules). Planned as a later milestone.
- SMS or other channels.
- A/B testing and advanced marketing analytics.
- Billing.

## 4. Users and Access

- **Owner (MVP):** one user with the `org_admin` role on one organization. Full access to every feature.
- **Data model:** a Role, Permission, RolePermission, and Membership model is seeded now. Every route checks permissions through `requirePermission()`, so adding members later is a data change, not a rewrite.
- **Future roles:** `platform_admin`, `org_admin`, and `member`, with member scope limited to their own campaigns.

## 5. Features

### 5.1 Mail Transport
- Add a transport: SMTP, Resend, or AWS SES. Credentials are encrypted at rest and never returned to the client after saving; the UI shows a masked value.
- Test the connection before the transport can be used for sending.
- Each organization has one default transport in the MVP.
- Transport is behind a common adapter interface, so sending code never references a provider directly.

### 5.2 Sender Identities
- A sender identity is a display name, a From address, an optional Reply-To, and a default flag.
- The From address must belong to a domain that is verified for the transport. The server enforces this, not the UI.
- Campaigns reference a sender identity by ID. Free-text From fields are not allowed.
- Domain verification (showing DNS records and polling status) is a post-MVP addition. In the MVP, the owner uses a domain verified directly in the provider's dashboard.

### 5.3 Template Designer
- **Canvas:** a centered email preview with blocks (text, image, button, divider, spacer) that the user adds, reorders, selects, and edits.
- **Properties panel:** edits the selected block. With nothing selected, it shows page settings: background, body width, text color, and alignment.
- **Top bar:** template name, From (chosen from sender identities), Reply-To, subject, preview text, Draft or Published status, and Publish.
- **Storage:** templates are stored as a JSON block tree. Email HTML is generated from that tree on publish.
- **Variables:** merge fields such as `{{first_name}}` are inserted from a variable list. Values are HTML-escaped at send time. A recipient missing a required value is marked failed rather than sent with a blank.
- **Versioning:** autosave writes the draft. Publish compiles it into an immutable version (HTML, plain text, subject, variable list). Campaigns pin a version, so editing a template never changes an email already queued.
- **Preview and test send:** preview renders with sample data. Test send delivers to the owner's own address.
- **Images:** uploaded to object storage and referenced by public URL. Base64 images are not used because email clients block them.

### 5.4 Audience
- Import a CSV with a preview step. The preview shows parsed rows and validation errors without writing anything.
- Commit the import with duplicate handling (by email address).
- Each contact has an email, name, and custom fields used for merge variables.
- Suppressed addresses (unsubscribed or hard-bounced) are excluded from every send.

### 5.5 Campaigns and Sending
- Compose a campaign by choosing a published template version, a sender identity, and an audience.
- Estimate the recipient count after suppressions, and check that every required variable exists for each recipient.
- Send creates one recipient row and one queue job per recipient. The API returns immediately.
- Sends are idempotent. Sending the same campaign twice does not duplicate recipients or emails.
- The worker processes jobs with a concurrency and rate limit set to the provider's limits. Transient failures retry with exponential backoff. Permanent failures (such as an invalid address) are marked failed without retry.
- Each email includes a plain-text version and an unsubscribe link that the template cannot remove.

### 5.6 Delivery Tracking
- Provider webhooks update each recipient's status: queued, sent, delivered, bounced, failed, opened, clicked, complained.
- A hard bounce or complaint adds the address to suppressions automatically.
- The campaign page shows live counters and a per-recipient table, filterable by status, with the error for failed rows.
- Live updates use Server-Sent Events, fed by Redis pub/sub from the worker and the webhook handler.

### 5.7 Overview
- Counters for the selected period: sent, delivered, bounced, failed, pending.
- Recent campaigns with status.
- Alerts: bounce rate above threshold, transport failing, domain not verified.

## 6. User Flow (MVP)

1. Log in.
2. Add a transport and test it.
3. Add a sender identity on a verified domain.
4. Import contacts from CSV and fix validation errors.
5. Design a template on the canvas, send a test, publish.
6. Create a campaign: template, sender, audience. Check the estimate.
7. Send. Watch progress on the live page.
8. Review the per-recipient table and export results.

## 7. Architecture

**Repository layout**

```
patra/
├── client/          # Next.js: dashboard, template designer, campaign pages
├── server/          # Node/Express API + BullMQ worker (separate entrypoints)
├── docker-compose.yml
└── .env
```

- **client:** Next.js frontend. Calls the server API. Runs as its own container.
- **server:** the API (`dist/index.js`) and the queue worker (`dist/worker.js`) share one codebase, Prisma client, and transport adapters, but run as separate processes and containers. The worker keeps processing jobs even when the API restarts.
- **PostgreSQL:** system of record. Accessed through Prisma.
- **Redis:** BullMQ queue storage and pub/sub for live updates.
- **Resend:** default mail transport. SMTP and SES are adapters behind the same interface.
- **Docker Compose:** runs client, server, worker, Postgres, and Redis locally with one command.

**Hosting (planned):** client and server on Render or Railway, worker as a separate service on the same platform, managed Postgres (Neon or Supabase), managed Redis (Upstash).

**Why the worker is separate:** sending thousands of emails needs a long-running process that polls the queue continuously. Request handlers and serverless functions are not suited to that work.

## 8. Data Model (MVP)

```
User
Organization
Membership (user, organization, role)          -- seeded for the owner
Role, Permission, RolePermission               -- seeded, enforced by middleware
MailTransport (type, encrypted credentials, rate limit, isDefault)
Domain (transport, name, verified)
SenderIdentity (organization, transport, fromEmail, displayName, replyTo, isDefault)
Contact (organization, email, name, customFields)
Suppression (organization, email, reason)
Template (organization, name, status, draftJson)
TemplateVersion (template, version, subject, blocksJson, html, text, variables)
Campaign (organization, templateVersion, senderIdentity, audience, status, scheduledAt)
CampaignRecipient (campaign, contact, status, providerMessageId, error, timestamps)
```

Every table that holds tenant data carries `organizationId`, and every query filters on it.

## 9. API (MVP, 24 routes)

All organization routes are under `/api/orgs/:orgId`. The owner is the only caller, but the path shape stays the same for multi-user later.

| Area | Method and path |
|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me` |
| Transport | `GET, POST /api/orgs/:orgId/transports`, `POST /api/orgs/:orgId/transports/:id/test` |
| Senders | `GET, POST /api/orgs/:orgId/senders` |
| Templates | `GET, POST /api/orgs/:orgId/templates`, `GET /api/orgs/:orgId/templates/:id`, `PUT /api/orgs/:orgId/templates/:id/draft`, `POST /api/orgs/:orgId/templates/:id/publish`, `POST /api/orgs/:orgId/templates/:id/preview`, `POST /api/orgs/:orgId/templates/:id/test-send`, `POST /api/orgs/:orgId/uploads` |
| Contacts | `POST /api/orgs/:orgId/contacts/import/preview`, `POST /api/orgs/:orgId/contacts/import` |
| Campaigns | `GET, POST /api/orgs/:orgId/campaigns`, `GET /api/orgs/:orgId/campaigns/:id`, `POST /api/orgs/:orgId/campaigns/:id/send`, `GET /api/orgs/:orgId/campaigns/:id/recipients`, `GET /api/orgs/:orgId/campaigns/:id/stream` |

Webhook receivers (`/api/webhooks/resend`) are not counted above because they are called by the provider, not by the user, and they verify a signature instead of a session.

## 10. Security and Reliability

- **Tenant isolation:** every query is scoped by `organizationId`. A resource that belongs to another organization returns 404, not 403.
- **Secrets:** provider credentials are encrypted at rest and never sent to the client after saving.
- **Authorization:** `requirePermission()` on every route. Validation with zod on every request body.
- **Sender integrity:** From addresses are validated server-side against verified domains.
- **Idempotency:** send, pause, and resume can be retried safely.
- **Template immutability:** campaigns pin a published version. Edits never reach queued mail.
- **Deliverability:** SPF, DKIM, and DMARC on the sending domain. Plain-text part included. Bounce and complaint handling automatic.
- **Compliance:** unsubscribe link in every bulk email. Suppressions enforced at query time, not just in the UI.
- **Audit:** send events and transport changes logged with the time and actor.

## 11. Success Criteria

- A 100-recipient campaign sends end to end, with every recipient row reaching a final status.
- Killing and restarting the worker mid-send loses no recipients and sends no duplicates.
- A template edited after a campaign is queued does not change that campaign's emails.
- A From address on an unverified domain is rejected by the API.
- The live page reflects status changes within a few seconds.
- Load test: 2,000 queued jobs processed through Mailtrap without errors.

## 12. Milestones

1. **M1:** Project setup (client, server, Docker Compose), auth, seeded owner, transport and sender identities.
2. **M2:** Template designer: blocks, properties panel, draft autosave, publish to immutable versions, preview, test send.
3. **M3:** Contacts import with preview and validation; suppressions.
4. **M4:** Campaigns: create, estimate, send, BullMQ worker, provider adapter, idempotency.
5. **M5:** Webhooks, recipient tracking, live status via SSE.
6. **M6:** Overview counters and alerts; CSV export.
7. **Post-MVP:** domain verification flow in-app, scheduled sends, trigger-based automation, team roles and invitations, audit log UI, platform admin.

## 13. Open Questions

- Should the template editor support nested layout blocks (columns) in the first release, or only single-column stacks?
- Which sending domain will the owner verify for the demo?
- Which transport will be the default for the demo: Resend or Brevo?
