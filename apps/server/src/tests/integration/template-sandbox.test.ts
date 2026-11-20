import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { app } from "../../app.js";
import { encrypt } from "../../lib/crypto.js";
import { MailTransport, Domain } from "../../models/mailTransport.model.js";
import { Membership, Role } from "../../models/identity.model.js";
import { fakeTransport } from "../../transports/index.js";
import { TestEmail } from "../../models/test-email.model.js";
import { setupTestDb, teardownTestDb, clearTestDb, seedTestContext } from "../testHelper.js";

const draft = {
  name: "Sandbox confirmation", subject: "Hi {{name}}", previewText: "Your registration",
  page: { bg: "#ffffff", text: "#292524", width: 600, align: "left" },
  blocks: [{ id: "greeting", type: "text", text: "Hello {{name}}", size: 16, weight: 400 }],
};
async function fixture() {
  const ctx = await seedTestContext();
  await MailTransport.updateOne({ _id: ctx.transport.id }, { $set: { status: "UNVERIFIED", credentialsEncrypted: encrypt("re_sandbox_test_only") } });
  const created = await request(app).post(`/api/orgs/${ctx.organization.id}/templates`).auth(ctx.accessToken, { type: "bearer" }).send(draft);
  expect(created.status).toBe(201);
  return { ...ctx, path: `/api/orgs/${ctx.organization.id}/templates/${created.body.data.id}/test-send`, body: { mode: "sandbox", transportId: ctx.transport.id, revision: created.body.data.revision, requestId: randomUUID() } };
}
const send = (ctx: Awaited<ReturnType<typeof fixture>>, body = ctx.body) => request(app).post(ctx.path).auth(ctx.accessToken, { type: "bearer" }).send(body);

describe("Owner-only template sandbox", () => {
  beforeAll(setupTestDb);
  afterAll(teardownTestDb);
  beforeEach(clearTestDb);
  afterEach(() => vi.unstubAllGlobals());

  it("sends only to the authenticated owner, persists correlation, and leaves transport/domain state unchanged", async () => {
    const ctx = await fixture();
    const provider = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "sandbox-message" }), { status: 200 }));
    vi.stubGlobal("fetch", provider);
    const result = await send(ctx);
    expect(result.status).toBe(200);
    expect(result.body.data).toMatchObject({ mode: "sandbox", recipient: ctx.user.email, id: "sandbox-message" });
    const payload = JSON.parse(provider.mock.calls[0][1].body);
    expect(payload.to).toEqual([ctx.user.email]);
    expect(payload.from).toBe("Patra Sandbox <onboarding@resend.dev>");
    expect(payload.html).toContain("Hello Aarav");
    expect(payload.text).toBe("Hello Aarav");
    expect(await TestEmail.countDocuments({ organizationId: ctx.organization.id, providerMessageId: "sandbox-message", status: "SENT" })).toBe(1);
    expect((await MailTransport.findById(ctx.transport.id))?.status).toBe("UNVERIFIED");
    expect(await Domain.countDocuments({ organizationId: ctx.organization.id })).toBe(1);
  });

  it("reuses a successful request without sending twice", async () => {
    const ctx = await fixture();
    const provider = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "retry-message" }), { status: 200 }));
    vi.stubGlobal("fetch", provider);
    expect((await send(ctx)).status).toBe(200);
    expect((await send(ctx)).status).toBe(200);
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("rejects a client-supplied recipient and stale revisions before contacting the provider", async () => {
    const ctx = await fixture();
    const provider = vi.fn();
    vi.stubGlobal("fetch", provider);
    expect((await request(app).post(ctx.path).auth(ctx.accessToken, { type: "bearer" }).send({ ...ctx.body, recipient: "someone@example.test" })).status).toBe(400);
    expect((await send(ctx, { ...ctx.body, revision: randomUUID() })).status).toBe(409);
    expect(provider).not.toHaveBeenCalled();
  });

  it("rejects a transport from another organization", async () => {
    const ctx = await fixture();
    const other = await seedTestContext();
    const provider = vi.fn();
    vi.stubGlobal("fetch", provider);
    expect((await send(ctx, { ...ctx.body, transportId: other.transport.id })).status).toBe(404);
    expect(provider).not.toHaveBeenCalled();
  });

  it("rejects a member even when their permissions allow template tests", async () => {
    const ctx = await fixture();
    const role = await Role.create({ name: "member", organizationId: ctx.organization.id, permissions: ["manage_templates", "send_campaigns"] });
    await Membership.updateOne({ userId: ctx.user.id, organizationId: ctx.organization.id }, { $set: { roleId: role.id } });
    const provider = vi.fn();
    vi.stubGlobal("fetch", provider);
    expect((await send(ctx)).status).toBe(403);
    expect(provider).not.toHaveBeenCalled();
  });

  it("keeps normal verified-sender tests protected", async () => {
    const ctx = await fixture();
    const provider = vi.fn();
    vi.stubGlobal("fetch", provider);
    await Domain.updateOne({ _id: ctx.domain.id }, { $set: { verified: false } });
    const result = await request(app).post(ctx.path).auth(ctx.accessToken, { type: "bearer" }).send({ revision: ctx.body.revision, senderId: ctx.sender.id, requestId: randomUUID() });
    expect(result.status).toBe(400);
    expect(provider).not.toHaveBeenCalled();
  });

  it("preserves successful verified-sender tests", async () => {
    const ctx = await fixture();
    await MailTransport.updateOne({ _id: ctx.transport.id }, { $set: { status: "VERIFIED" } });
    const provider = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "verified-message" }), { status: 200 }));
    vi.stubGlobal("fetch", provider);
    const result = await request(app).post(ctx.path).auth(ctx.accessToken, { type: "bearer" }).send({ revision: ctx.body.revision, senderId: ctx.sender.id, requestId: randomUUID() });
    expect(result.status).toBe(200);
    expect(result.body.data.mode).toBe("verified");
    expect(fakeTransport.allSends[0].from).toBe("Test Sender <newsletter@example.com>");
  });

  it("retries uncertain provider requests with the same idempotency key", async () => {
    const ctx = await fixture();
    const provider = vi.fn().mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "recovered-message" }), { status: 200 }));
    vi.stubGlobal("fetch", provider);
    expect((await send(ctx)).status).toBe(502);
    expect((await send(ctx)).status).toBe(200);
    expect(provider.mock.calls[0][1].headers["Idempotency-Key"]).toBe(provider.mock.calls[1][1].headers["Idempotency-Key"]);
  });

  it("reports provider rejection without leaking its credentials or marking the test sent", async () => {
    const ctx = await fixture();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "private provider details" }), { status: 403 })));
    const result = await send(ctx);
    expect(result.status).toBe(502);
    expect(result.body.message).toContain("Resend account email");
    expect(JSON.stringify(result.body)).not.toContain("re_sandbox_test_only");
    expect(await TestEmail.countDocuments({ organizationId: ctx.organization.id, status: "SENT" })).toBe(0);
  });
});
