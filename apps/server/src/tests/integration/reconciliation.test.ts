import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupTestDb,
  teardownTestDb,
  clearTestDb,
  seedTestContext,
} from "../testHelper.js";
import { Campaign, CampaignRecipient } from "../../models/campaign.model.js";
import { reconcileOrphanedRecipients } from "../../queue/reconcile.js";
import { getSendQueue } from "../../queue/send.queue.js";

describe("Integration: Reconciliation", () => {
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
  });

  it("re-enqueues orphaned QUEUED recipients older than 10 minutes with no active job", async () => {
    const campaign = await Campaign.create({
      organizationId: ctx.organization._id,
      name: "Reconciliation Test Campaign",
      templateVersionId: ctx.templateVersion._id,
      senderIdentityId: ctx.sender._id,
      listId: ctx.list._id,
      status: "SENDING",
      counters: { totalRecipients: 2, sentCount: 0, deliveredCount: 0, bouncedCount: 0, failedCount: 0 },
    });

    const elevenMinutesAgo = new Date(Date.now() - 11 * 60 * 1000);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // 1. Orphaned recipient (11 minutes old, QUEUED, no job)
    const orphan = await CampaignRecipient.create({
      organizationId: ctx.organization._id,
      campaignId: campaign._id,
      contactId: ctx.contacts[0]._id,
      email: ctx.contacts[0].email,
      status: "QUEUED",
      createdAt: elevenMinutesAgo,
    });

    // 2. Fresh recipient (only 5 minutes old, QUEUED, no job -> should NOT be re-enqueued yet)
    const fresh = await CampaignRecipient.create({
      organizationId: ctx.organization._id,
      campaignId: campaign._id,
      contactId: ctx.contacts[1]._id,
      email: ctx.contacts[1].email,
      status: "QUEUED",
      createdAt: fiveMinutesAgo,
    });

    const queue = getSendQueue(ctx.transport._id.toString());

    // Initially neither has a job in BullMQ
    expect(await queue.getJob(orphan._id.toString())).toBeFalsy();
    expect(await queue.getJob(fresh._id.toString())).toBeFalsy();

    // Run reconciliation with 10 minute threshold
    const result = await reconcileOrphanedRecipients(10);
    expect(result.reEnqueued).toBe(1);

    // Assert that orphan received a job in BullMQ
    const orphanJob = await queue.getJob(orphan._id.toString());
    expect(orphanJob).toBeDefined();
    expect(orphanJob?.data.recipientId).toBe(orphan._id.toString());

    // Fresh recipient should still have no job
    const freshJob = await queue.getJob(fresh._id.toString());
    expect(freshJob).toBeFalsy();
  });
});
