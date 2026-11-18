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

});
