import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupTestDb,
  teardownTestDb,
  clearTestDb,
  seedTestContext,
} from "../testHelper.js";
import { Campaign, CampaignRecipient } from "../../models/campaign.model.js";
import { sendEmailProcessor } from "../../processors/sendEmail.processor.js";
import { fakeTransport, registerTransport } from "../../transports/index.js";

describe("Integration: Idempotency", () => {
  let ctx: Awaited<ReturnType<typeof seedTestContext>>;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    ctx = await seedTestContext();
    registerTransport(ctx.transport._id.toString(), fakeTransport);
    fakeTransport.reset();
  });

  it("running the same job twice produces one SENT, one sentCount increment, and one transport call", async () => {
    const campaign = await Campaign.create({
      organizationId: ctx.organization._id,
      name: "Idempotency Test Campaign",
      templateVersionId: ctx.templateVersion._id,
      senderIdentityId: ctx.sender._id,
      listId: ctx.list._id,
      status: "SENDING",
      counters: { totalRecipients: 1, sentCount: 0, deliveredCount: 0, bouncedCount: 0, failedCount: 0 },
    });

    const recipient = await CampaignRecipient.create({
      organizationId: ctx.organization._id,
      campaignId: campaign._id,
      contactId: ctx.contacts[0]._id, // Alice
      email: ctx.contacts[0].email,
      status: "QUEUED",
    });

    const job = {
      id: recipient._id.toString(),
      data: {
        recipientId: recipient._id.toString(),
        campaignId: campaign._id.toString(),
        organizationId: ctx.organization._id.toString(),
      },
    } as any;

    // Run processor 1st time
    const res1 = await sendEmailProcessor(job);
    expect(res1.status).toBe("sent");

    // Verify after 1st execution
    const r1 = await CampaignRecipient.findById(recipient._id);
    expect(r1?.status).toBe("SENT");

    const c1 = await Campaign.findById(campaign._id);
    expect(c1?.counters.sentCount).toBe(1);

    const idempotencyKey = `${campaign._id}:${recipient._id}`;
    expect(fakeTransport.allSends.length).toBe(1);
    expect(fakeTransport.sends.get(idempotencyKey)?.length).toBe(1);

    // Run processor 2nd time with exact same job
    const res2 = await sendEmailProcessor(job);
    expect(res2.status).toBe("already_processed");
    expect(res2.recipientStatus).toBe("SENT");

    // Verify after 2nd execution: no double send, no counter increment
    const r2 = await CampaignRecipient.findById(recipient._id);
    expect(r2?.status).toBe("SENT");

    const c2 = await Campaign.findById(campaign._id);
    expect(c2?.counters.sentCount).toBe(1);

    expect(fakeTransport.allSends.length).toBe(1);
    expect(fakeTransport.sends.get(idempotencyKey)?.length).toBe(1);
  });
});
