import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Types } from "mongoose";
import { DelayedError } from "bullmq";
import {
  setupTestDb,
  teardownTestDb,
  clearTestDb,
  seedTestContext,
} from "../testHelper.js";
import { Campaign, CampaignRecipient } from "../../models/campaign.model.js";
import { sendEmailProcessor } from "../../processors/sendEmail.processor.js";
import { fakeTransport, registerTransport } from "../../transports/index.js";
import { TransientError, PermanentError } from "../../lib/errors.js";

describe("Unit: sendEmailProcessor", () => {
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

  it("returns early on each final status without calling transport", async () => {
    const campaign = await Campaign.create({
      organizationId: ctx.organization._id,
      name: "Status Test Campaign",
      templateVersionId: ctx.templateVersion._id,
      senderIdentityId: ctx.sender._id,
      listId: ctx.list._id,
      status: "SENDING",
      counters: { totalRecipients: 8, sentCount: 0, deliveredCount: 0, bouncedCount: 0, failedCount: 0 },
    });

    const finalStatuses = [
      "SENT",
      "DELIVERED",
      "BOUNCED",
      "FAILED",
      "OPENED",
      "CLICKED",
      "COMPLAINED",
      "SKIPPED",
    ] as const;

    for (const status of finalStatuses) {
      const recipient = await CampaignRecipient.create({
        organizationId: ctx.organization._id,
        campaignId: campaign._id,
        contactId: ctx.contacts[0]._id,
        email: `status-${status.toLowerCase()}@test.com`,
        status,
      });

      const fakeJob = {
        id: recipient._id.toString(),
        data: {
          recipientId: recipient._id.toString(),
          campaignId: campaign._id.toString(),
          organizationId: ctx.organization._id.toString(),
        },
      } as any;

      const result = await sendEmailProcessor(fakeJob);
      expect(result.status).toBe("already_processed");
      expect(result.recipientStatus).toBe(status);
    }

    // Assert that fakeTransport was never called
    expect(fakeTransport.allSends.length).toBe(0);
  });

  it("does not send and throws DelayedError when campaign is PAUSED", async () => {
    const campaign = await Campaign.create({
      organizationId: ctx.organization._id,
      name: "Paused Campaign",
      templateVersionId: ctx.templateVersion._id,
      senderIdentityId: ctx.sender._id,
      listId: ctx.list._id,
      status: "PAUSED",
      counters: { totalRecipients: 1, sentCount: 0, deliveredCount: 0, bouncedCount: 0, failedCount: 0 },
    });

    const recipient = await CampaignRecipient.create({
      organizationId: ctx.organization._id,
      campaignId: campaign._id,
      contactId: ctx.contacts[0]._id,
      email: "paused-test@test.com",
      status: "QUEUED",
    });

    let delayedTimestamp = 0;
    const fakeJob = {
      id: recipient._id.toString(),
      data: {
        recipientId: recipient._id.toString(),
        campaignId: campaign._id.toString(),
        organizationId: ctx.organization._id.toString(),
      },
      moveToDelayed: async (ts: number) => {
        delayedTimestamp = ts;
      },
    } as any;

    await expect(sendEmailProcessor(fakeJob, "token_123")).rejects.toThrow(DelayedError);
    expect(delayedTimestamp).toBeGreaterThan(Date.now());
    expect(fakeTransport.allSends.length).toBe(0);

    // Recipient remains QUEUED
    const freshRecipient = await CampaignRecipient.findById(recipient._id);
    expect(freshRecipient?.status).toBe("QUEUED");
  });

  it("throws TransientError so BullMQ retries", async () => {
    const campaign = await Campaign.create({
      organizationId: ctx.organization._id,
      name: "Transient Test Campaign",
      templateVersionId: ctx.templateVersion._id,
      senderIdentityId: ctx.sender._id,
      listId: ctx.list._id,
      status: "SENDING",
      counters: { totalRecipients: 1, sentCount: 0, deliveredCount: 0, bouncedCount: 0, failedCount: 0 },
    });

    const recipient = await CampaignRecipient.create({
      organizationId: ctx.organization._id,
      campaignId: campaign._id,
      contactId: ctx.contacts[0]._id,
      email: "transient@test.com",
      status: "QUEUED",
    });

    fakeTransport.failNextWithTransient(1);

    const fakeJob = {
      id: recipient._id.toString(),
      data: {
        recipientId: recipient._id.toString(),
        campaignId: campaign._id.toString(),
        organizationId: ctx.organization._id.toString(),
      },
    } as any;

    await expect(sendEmailProcessor(fakeJob)).rejects.toThrow(TransientError);

    // Recipient stays QUEUED on transient error
    const freshRecipient = await CampaignRecipient.findById(recipient._id);
    expect(freshRecipient?.status).toBe("QUEUED");
  });

  it("marks recipient FAILED once and increments failedCount on PermanentError", async () => {
    const campaign = await Campaign.create({
      organizationId: ctx.organization._id,
      name: "Permanent Test Campaign",
      templateVersionId: ctx.templateVersion._id,
      senderIdentityId: ctx.sender._id,
      listId: ctx.list._id,
      status: "SENDING",
      counters: { totalRecipients: 1, sentCount: 0, deliveredCount: 0, bouncedCount: 0, failedCount: 0 },
    });

    const recipient = await CampaignRecipient.create({
      organizationId: ctx.organization._id,
      campaignId: campaign._id,
      contactId: ctx.contacts[0]._id,
      email: "permanent@test.com",
      status: "QUEUED",
    });

    fakeTransport.failNextWithPermanent(1);

    const fakeJob = {
      id: recipient._id.toString(),
      data: {
        recipientId: recipient._id.toString(),
        campaignId: campaign._id.toString(),
        organizationId: ctx.organization._id.toString(),
      },
    } as any;

    const result = await sendEmailProcessor(fakeJob);
    expect(result.status).toBe("failed_permanent");

    const freshRecipient = await CampaignRecipient.findById(recipient._id);
    expect(freshRecipient?.status).toBe("FAILED");
    expect(freshRecipient?.error).toContain("Simulated permanent error");

    const freshCampaign = await Campaign.findById(campaign._id);
    expect(freshCampaign?.counters.failedCount).toBe(1);
    expect(freshCampaign?.counters.sentCount).toBe(0);
  });
});

describe("Suppression at dispatch", () => {
  beforeAll(setupTestDb);
  afterAll(teardownTestDb);
  beforeEach(clearTestDb);

  it("skips an address suppressed after it was queued", async () => {
    const ctx = await seedTestContext();
    const campaign = await Campaign.create({
      organizationId: ctx.organization.id, name: "Late suppression",
      templateVersionId: ctx.templateVersion.id, senderIdentityId: ctx.sender.id,
      listId: ctx.list.id, status: "QUEUED",
    });
    const recipient = await CampaignRecipient.create({
      organizationId: ctx.organization.id, campaignId: campaign.id,
      contactId: ctx.contacts[0].id, email: ctx.contacts[0].email, status: "QUEUED",
    });
    const { Suppression } = await import("../../models/audience.model.js");
    await Suppression.create({ organizationId: ctx.organization.id, email: recipient.email, reason: "UNSUBSCRIBED" });
    const result = await sendEmailProcessor({
      data: { recipientId: recipient.id, campaignId: campaign.id, organizationId: ctx.organization.id },
    } as any);
    expect(result.status).toBe("suppressed");
    expect((await CampaignRecipient.findById(recipient.id))?.status).toBe("SKIPPED");
  });
});
