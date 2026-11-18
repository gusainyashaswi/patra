import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupTestDb, teardownTestDb, clearTestDb, seedTestContext } from "../testHelper.js";
import { Campaign, CampaignRecipient } from "../../models/campaign.model.js";
import { Contact, List } from "../../models/audience.model.js";
import { MailTransport } from "../../models/mailTransport.model.js";
import { startSend } from "../../services/send.service.js";
import { createSendWorker } from "../../worker.js";
import { MailtrapSandbox } from "./mailtrap-sandbox.js";
import { registerTransport } from "../../transports/index.js";
import { fakeTransport } from "../../transports/index.js";

const liveSandbox = process.env.PATRA_MAILTRAP_LOAD === "1";
describe.skipIf(process.env.PATRA_LOAD !== "1" && !liveSandbox)("Isolated queue load", () => {
  beforeAll(setupTestDb);
  afterAll(teardownTestDb);
  it("dispatches 2,000 recipients once and completes the campaign", async () => {
    await clearTestDb();
    const ctx = await seedTestContext();
    const sandbox = liveSandbox ? new MailtrapSandbox(process.env.MAILTRAP_API_TOKEN || "", process.env.MAILTRAP_INBOX_ID || "") : null;
    if (sandbox) registerTransport(ctx.transport.id, sandbox);
    const rate = sandbox ? Math.max(1, Math.min(5, Math.floor(Number(process.env.MAILTRAP_RATE_PER_SECOND)) || 1)) : 1000;
    await MailTransport.updateOne({ _id: ctx.transport.id }, { $set: { dailyLimit: 0 } });
    const contacts = await Contact.insertMany(Array.from({ length: 2000 }, (_, i) => ({ organizationId: ctx.organization.id, email: `load-${i}@example.test`, name: `Recipient ${i}`, customFields: { ticket: `T${i}` } })));
    await List.updateOne({ _id: ctx.list.id }, { $set: { contactIds: contacts.map(c => c.id) } });
    const campaign = await Campaign.create({ organizationId: ctx.organization.id, name: "Queue load", templateVersionId: ctx.templateVersion.id, senderIdentityId: ctx.sender.id, listId: ctx.list.id });
    await startSend(ctx.organization.id, campaign.id);
    createSendWorker(ctx.transport.id, rate);
    const deadline = Date.now() + (sandbox ? 3500000 : 110000);
    while (Date.now() < deadline) {
      if ((await Campaign.findById(campaign.id))?.status === "COMPLETED") break;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    expect(await CampaignRecipient.countDocuments({ campaignId: campaign.id, status: "SENT" })).toBe(2000);
    expect((await Campaign.findById(campaign.id))?.status).toBe("COMPLETED");
    if (sandbox) expect(sandbox.accepted.size).toBe(2000);
    else {
      expect(fakeTransport.allSends).toHaveLength(2000);
      expect(new Set(fakeTransport.allSends.map(m => m.idempotencyKey)).size).toBe(2000);
    }
  }, liveSandbox ? 3600000 : 120000);
});
