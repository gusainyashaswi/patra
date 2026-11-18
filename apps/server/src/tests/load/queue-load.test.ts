import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupTestDb, teardownTestDb, clearTestDb, seedTestContext } from "../testHelper.js";
import { Campaign, CampaignRecipient } from "../../models/campaign.model.js";
import { Contact, List } from "../../models/audience.model.js";
import { MailTransport } from "../../models/mailTransport.model.js";
import { startSend } from "../../services/send.service.js";
import { createSendWorker } from "../../worker.js";
import { fakeTransport } from "../../transports/index.js";

describe.skipIf(process.env.PATRA_LOAD !== "1")("Isolated queue load (fake provider)", () => {
  beforeAll(setupTestDb);
  afterAll(teardownTestDb);
  it("dispatches 2,000 recipients once and completes the campaign", async () => {
    await clearTestDb();
    const ctx = await seedTestContext();
    await MailTransport.updateOne({ _id: ctx.transport.id }, { $set: { dailyLimit: 0 } });
    const contacts = await Contact.insertMany(Array.from({ length: 2000 }, (_, i) => ({ organizationId: ctx.organization.id, email: `load-${i}@example.test`, name: `Recipient ${i}`, customFields: { ticket: `T${i}` } })));
    await List.updateOne({ _id: ctx.list.id }, { $set: { contactIds: contacts.map(c => c.id) } });
    const campaign = await Campaign.create({ organizationId: ctx.organization.id, name: "Queue load", templateVersionId: ctx.templateVersion.id, senderIdentityId: ctx.sender.id, listId: ctx.list.id });
    await startSend(ctx.organization.id, campaign.id);
    createSendWorker(ctx.transport.id, 1000);
    const deadline = Date.now() + 110000;
    while (Date.now() < deadline) {
      if ((await Campaign.findById(campaign.id))?.status === "COMPLETED") break;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    expect(await CampaignRecipient.countDocuments({ campaignId: campaign.id, status: "SENT" })).toBe(2000);
    expect((await Campaign.findById(campaign.id))?.status).toBe("COMPLETED");
    expect(fakeTransport.allSends).toHaveLength(2000);
    expect(new Set(fakeTransport.allSends.map(m => m.idempotencyKey)).size).toBe(2000);
  }, 120000);
});
