import { sendEmailProcessor } from "../../processors/sendEmail.processor.js";
import { fakeTransport } from "../../transports/index.js";
import { AuditLog } from "../../models/infra.model.js";
import request from "supertest";
import { app } from "../../app.js";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupTestDb, teardownTestDb, clearTestDb, seedTestContext } from "../testHelper.js";
import { Campaign, CampaignRecipient } from "../../models/campaign.model.js";
import { startSend } from "../../services/send.service.js";
import { reserveQuota, DailyQuota } from "../../services/quota.service.js";
import { finishCampaign } from "../../services/campaign-lifecycle.js";
import { Contact } from "../../models/audience.model.js";

describe("MVP completion", () => {
  beforeAll(setupTestDb);
  afterAll(teardownTestDb);
  beforeEach(clearTestDb);
  it("snapshots merge values and sender at queue time", async () => {
    const ctx = await seedTestContext();
    const campaign = await Campaign.create({ organizationId: ctx.organization.id, name: "Snapshot", templateVersionId: ctx.templateVersion.id, senderIdentityId: ctx.sender.id, listId: ctx.list.id });
    await startSend(ctx.organization.id, campaign.id);
    await Contact.updateOne({ _id: ctx.contacts[0].id }, { $set: { name: "Changed", customFields: {} } });
    const recipient = await CampaignRecipient.findOne({ campaignId: campaign.id, contactId: ctx.contacts[0].id });
    expect(recipient?.mergeData).toMatchObject({ name: "Alice", ticket: "TCK-101" });
    expect(recipient?.senderSnapshot?.fromEmail).toBe(ctx.sender.fromEmail);
    await sendEmailProcessor({ data: { recipientId: recipient!.id, campaignId: campaign.id, organizationId: ctx.organization.id } } as any);
    expect(fakeTransport.allSends[0].html).toContain("Hello Alice");
    expect(await AuditLog.countDocuments({ organizationId: ctx.organization.id, action: "campaign.send", targetId: campaign.id })).toBe(1);
  });
  it("completes only after dispatch has no queued recipients", async () => {
    const ctx = await seedTestContext();
    const campaign = await Campaign.create({ organizationId: ctx.organization.id, name: "Lifecycle", templateVersionId: ctx.templateVersion.id, senderIdentityId: ctx.sender.id, listId: ctx.list.id });
    await startSend(ctx.organization.id, campaign.id);
    await finishCampaign(ctx.organization.id, campaign.id);
    expect((await Campaign.findById(campaign.id))?.status).toBe("QUEUED");
    await CampaignRecipient.updateMany({ campaignId: campaign.id, status: "QUEUED" }, { $set: { status: "SENT" } });
    await finishCampaign(ctx.organization.id, campaign.id);
    expect((await Campaign.findById(campaign.id))?.status).toBe("COMPLETED");
  });

  it("reserves daily quota atomically and reuses reservations", async () => {
    const ctx = await seedTestContext();
    const campaign = await Campaign.create({ organizationId: ctx.organization.id, name: "Quota", templateVersionId: ctx.templateVersion.id, senderIdentityId: ctx.sender.id, listId: ctx.list.id });
    await startSend(ctx.organization.id, campaign.id);
    const recipients = await CampaignRecipient.find({ campaignId: campaign.id, status: "QUEUED" });
    const results = await Promise.all(recipients.map(r => reserveQuota(ctx.organization.id, ctx.transport.id, r.id, 1)));
    expect(results.filter(Boolean)).toHaveLength(1);
    const winner = recipients[results.indexOf(true)];
    expect(await reserveQuota(ctx.organization.id, ctx.transport.id, winner.id, 1)).toBe(true);
    expect((await DailyQuota.findOne({ transportId: ctx.transport.id }))?.used).toBe(1);
    expect(await reserveQuota(ctx.organization.id, ctx.transport.id, winner.id, 1, new Date(Date.now() + 86400000))).toBe(true);
    expect(await DailyQuota.countDocuments({ transportId: ctx.transport.id })).toBe(2);
  });

  it("protects streams and provides an initial campaign snapshot", async () => {
    const ctx = await seedTestContext();
    const campaign = await Campaign.create({ organizationId: ctx.organization.id, name: "Stream", templateVersionId: ctx.templateVersion.id, senderIdentityId: ctx.sender.id, listId: ctx.list.id });
    const path = `/api/orgs/${ctx.organization.id}/campaigns/${campaign.id}/stream`;
    expect((await request(app).get(path)).status).toBe(401);
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>(resolve => server.once("listening", resolve));
    const address = server.address() as { port: number };
    const controller = new AbortController();
    try {
      const response = await fetch(`http://127.0.0.1:${address.port}${path}`, { headers: { Authorization: `Bearer ${ctx.accessToken}` }, signal: controller.signal });
      expect(response.headers.get("content-type")).toContain("text/event-stream");
      const reader = response.body!.getReader();
      const first = await reader.read();
      expect(new TextDecoder().decode(first.value)).toContain("event: snapshot");
      await reader.cancel();
    } finally { controller.abort(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
  });

  it("exports only filtered recipients and rejects invalid statuses", async () => {
    const ctx = await seedTestContext();
    const campaign = await Campaign.create({ organizationId: ctx.organization.id, name: "Export", templateVersionId: ctx.templateVersion.id, senderIdentityId: ctx.sender.id, listId: ctx.list.id });
    await startSend(ctx.organization.id, campaign.id);
    const path = `/api/orgs/${ctx.organization.id}/campaigns/${campaign.id}/recipients/export`;
    const result = await request(app).get(path + "?status=SKIPPED").auth(ctx.accessToken, { type: "bearer" });
    expect(result.status).toBe(200);
    expect(result.text).toContain("charlie@test.com");
    expect(result.text).not.toContain("alice@test.com");
    expect((await request(app).get(path + "?status=INVALID").auth(ctx.accessToken, { type: "bearer" })).status).toBe(400);
  });

  it("reports real overview data with validated periods", async () => {
    const ctx = await seedTestContext();
    const campaign = await Campaign.create({ organizationId: ctx.organization.id, name: "Overview", templateVersionId: ctx.templateVersion.id, senderIdentityId: ctx.sender.id, listId: ctx.list.id });
    await startSend(ctx.organization.id, campaign.id);
    const path = `/api/orgs/${ctx.organization.id}/overview`;
    const result = await request(app).get(path).auth(ctx.accessToken, { type: "bearer" });
    expect(result.status).toBe(200);
    expect(result.body.data.stats.pending).toBe(2);
    expect(result.body.data.stats.sent).toBe(0);
    expect(result.body.data.setup.every((step: { done: boolean }) => step.done)).toBe(true);
    expect((await request(app).get(path + "?period=invalid").auth(ctx.accessToken, { type: "bearer" })).status).toBe(400);
  });

  it("flags uncertain expired attempts instead of sending again", async () => {
    const ctx = await seedTestContext();
    const campaign = await Campaign.create({ organizationId: ctx.organization.id, name: "Uncertain", templateVersionId: ctx.templateVersion.id, senderIdentityId: ctx.sender.id, listId: ctx.list.id });
    await startSend(ctx.organization.id, campaign.id);
    const recipient = await CampaignRecipient.findOne({ campaignId: campaign.id, status: "QUEUED" });
    await CampaignRecipient.updateOne({ _id: recipient!.id }, { $set: { firstAttemptAt: new Date(Date.now() - 24 * 3600000) } });
    await sendEmailProcessor({ data: { recipientId: recipient!.id, campaignId: campaign.id, organizationId: ctx.organization.id } } as any);
    expect((await CampaignRecipient.findById(recipient!.id))?.requiresReview).toBe(true);
    expect(fakeTransport.allSends).toHaveLength(0);
  });

  it("rejects access to another organization's reports and streams", async () => {
    const ctx = await seedTestContext();
    const other = await seedTestContext();
    const campaign = await Campaign.create({ organizationId: other.organization.id, name: "Private", templateVersionId: other.templateVersion.id, senderIdentityId: other.sender.id, listId: other.list.id });
    expect((await request(app).get(`/api/orgs/${other.organization.id}/overview`).auth(ctx.accessToken, { type: "bearer" })).status).toBe(404);
    expect((await request(app).get(`/api/orgs/${other.organization.id}/campaigns/${campaign.id}/stream`).auth(ctx.accessToken, { type: "bearer" })).status).toBe(404);
  });

  it("saves configured sending limits without returning credentials", async () => {
    const ctx = await seedTestContext();
    const response = await request(app).post(`/api/orgs/${ctx.organization.id}/transports`).auth(ctx.accessToken, { type: "bearer" }).send({ name: "Additional sender", type: "RESEND", apiKey: "re_local_test_only", ratePerSecond: 3, dailyLimit: 50 });
    expect(response.status).toBe(201);
    expect(response.body.data.dailyLimit).toBe(50);
    expect(response.body.data.ratePerSecond).toBe(3);
    expect(response.body.data.credentialsEncrypted).toBeUndefined();
    expect(response.body.data.isDefault).toBe(false);
    expect(await AuditLog.countDocuments({ organizationId: ctx.organization.id, action: "transport.create" })).toBe(1);
  });

});
