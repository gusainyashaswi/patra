import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupTestDb, teardownTestDb, clearTestDb, seedTestContext } from "../testHelper.js";
import { Campaign, CampaignRecipient } from "../../models/campaign.model.js";
import { startSend } from "../../services/send.service.js";
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
});
