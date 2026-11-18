import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupTestDb,
  teardownTestDb,
  clearTestDb,
  seedTestContext,
} from "../testHelper.js";
import { Campaign, CampaignRecipient } from "../../models/campaign.model.js";
import { createSendWorker, stopAllWorkers } from "../../worker.js";
import { getSendQueue } from "../../queue/send.queue.js";
import { fakeTransport, registerTransport } from "../../transports/index.js";

describe("Integration: Worker Failure Handler", () => {
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

  it("marks recipient FAILED after exhausting all attempts when transport fails every attempt", async () => {
    const campaign = await Campaign.create({
      organizationId: ctx.organization._id,
      name: "Failure Handler Test",
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
      email: ctx.contacts[0].email,
      status: "QUEUED",
    });

    // Configure fake transport to fail with transient error continuously
    fakeTransport.failNextWithTransient(10);

    const transportId = ctx.transport._id.toString();
    const queue = getSendQueue(transportId);

    // Create a real BullMQ worker with quick backoff for testing
    createSendWorker(transportId);

    // Add job with 2 max attempts and 50ms delay for fast test execution
    await queue.add(
      "sendEmail",
      {
        campaignId: campaign._id.toString(),
        recipientId: recipient._id.toString(),
        organizationId: ctx.organization._id.toString(),
      },
      {
        jobId: recipient._id.toString(),
        attempts: 2,
        backoff: { type: "fixed", delay: 50 },
      },
    );

    // Wait for the job to exhaust all attempts and fail
    await new Promise<void>((resolve) => {
      const interval = setInterval(async () => {
        const fresh = await CampaignRecipient.findById(recipient._id);
        if (fresh && fresh.status === "FAILED") {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });

    const finalRecipient = await CampaignRecipient.findById(recipient._id);
    expect(finalRecipient?.status).toBe("FAILED");
    expect(finalRecipient?.error).toContain("Exhausted retries");

    const finalCampaign = await Campaign.findById(campaign._id);
    expect(finalCampaign?.counters.failedCount).toBe(1);

    await stopAllWorkers();
  });
});
