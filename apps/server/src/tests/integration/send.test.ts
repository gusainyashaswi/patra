import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import {
  setupTestDb,
  teardownTestDb,
  clearTestDb,
  seedTestContext,
} from "../testHelper.js";
import { Campaign, CampaignRecipient } from "../../models/campaign.model.js";
import { Suppression, Contact, List } from "../../models/audience.model.js";
import { getSendQueue } from "../../queue/send.queue.js";
import { fakeTransport, registerTransport } from "../../transports/index.js";

describe("Integration: POST /api/orgs/:orgId/campaigns/:id/send", () => {
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

  it("returns 202 and queues jobs, returns 409 on repeat, skips suppressed and missing vars", async () => {
    // 1. Add a suppressed contact
    const suppressedContact = await Contact.create({
      organizationId: ctx.organization._id,
      name: "Suppressed Sam",
      email: "suppressed@test.com",
      customFields: { ticket: "TCK-999" },
    });

    await Suppression.create({
      organizationId: ctx.organization._id,
      email: "suppressed@test.com",
      reason: "UNSUBSCRIBED",
    });

    // Add all 4 contacts to list:
    // - Alice (valid: name + ticket)
    // - Bob (valid: name + ticket)
    // - Charlie (missing var: no ticket)
    // - Suppressed Sam (suppressed)
    const allContactIds = [...ctx.contacts.map((c) => c._id), suppressedContact._id];
    await List.updateOne(
      { _id: ctx.list._id },
      { $set: { contactIds: allContactIds } },
    );

    // 2. Create campaign in DRAFT status
    const campaign = await Campaign.create({
      organizationId: ctx.organization._id,
      name: "Newsletter Send Test",
      templateVersionId: ctx.templateVersion._id,
      senderIdentityId: ctx.sender._id,
      listId: ctx.list._id,
      status: "DRAFT",
    });

    const sendUrl = `/api/orgs/${ctx.organization._id}/campaigns/${campaign._id}/send`;

    // 3. First POST /send: should succeed with 202
    const res1 = await request(app)
      .post(sendUrl)
      .set("Authorization", `Bearer ${ctx.accessToken}`)
      .send();

    expect(res1.status).toBe(202);
    expect(res1.body.status).toBe("accepted");
    expect(res1.body.data.totalRecipients).toBe(3); // 4 contacts - 1 suppressed = 3 recipients created
    expect(res1.body.data.queuedCount).toBe(2); // Alice & Bob queued
    expect(res1.body.data.skippedCount).toBe(1); // Charlie skipped because missing ticket variable

    // 4. Verify recipient rows in MongoDB
    const recipients = await CampaignRecipient.find({ campaignId: campaign._id });
    expect(recipients.length).toBe(3);

    const charlieRecipient = recipients.find((r) => r.email === "charlie@test.com");
    expect(charlieRecipient?.status).toBe("SKIPPED");
    expect(charlieRecipient?.error).toContain("Missing required variables: ticket");

    const queuedRecipients = recipients.filter((r) => r.status === "QUEUED");
    expect(queuedRecipients.length).toBe(2);

    // Suppressed Sam must NOT exist in campaign recipients
    const suppressedRecipient = recipients.find((r) => r.email === "suppressed@test.com");
    expect(suppressedRecipient).toBeUndefined();

    // 5. Verify BullMQ jobs in queue
    const queue = getSendQueue(ctx.transport._id.toString());
    const queuedJob1 = await queue.getJob(queuedRecipients[0]._id.toString());
    const queuedJob2 = await queue.getJob(queuedRecipients[1]._id.toString());
    expect(queuedJob1).toBeDefined();
    expect(queuedJob2).toBeDefined();

    // Charlie (skipped) must NOT have a BullMQ job
    if (charlieRecipient) {
      const charlieJob = await queue.getJob(charlieRecipient._id.toString());
      expect(charlieJob).toBeFalsy();
    }

    // 6. Second POST /send: must return 409 Conflict (Idempotent send lock)
    const res2 = await request(app)
      .post(sendUrl)
      .set("Authorization", `Bearer ${ctx.accessToken}`)
      .send();

    expect(res2.status).toBe(409);
    expect(res2.body.message).toContain("already been queued");

    // Ensure total recipients and jobs did not change
    const recipientsAfter = await CampaignRecipient.find({ campaignId: campaign._id });
    expect(recipientsAfter.length).toBe(3);
  });

  it("allows exactly one of two simultaneous send requests to lock a draft campaign", async () => {
    const campaign = await Campaign.create({
      organizationId: ctx.organization._id,
      name: "Concurrent send lock",
      templateVersionId: ctx.templateVersion._id,
      senderIdentityId: ctx.sender._id,
      listId: ctx.list._id,
      status: "DRAFT",
    });
    const url = `/api/orgs/${ctx.organization._id}/campaigns/${campaign._id}/send`;

    const responses = await Promise.all([
      request(app).post(url).set("Authorization", `Bearer ${ctx.accessToken}`).send(),
      request(app).post(url).set("Authorization", `Bearer ${ctx.accessToken}`).send(),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([202, 409]);
    expect(await CampaignRecipient.countDocuments({ campaignId: campaign._id })).toBe(ctx.contacts.length);
  });
});

describe("Send setup regression", () => {
  beforeAll(setupTestDb);
  afterAll(teardownTestDb);
  beforeEach(clearTestDb);

  it("keeps the campaign editable when its audience is missing", async () => {
    const ctx = await seedTestContext();
    const campaign = await Campaign.create({
      organizationId: ctx.organization._id, name: "Missing audience",
      templateVersionId: ctx.templateVersion._id, senderIdentityId: ctx.sender._id,
      listId: ctx.list._id,
    });
    await List.deleteOne({ _id: ctx.list._id });
    const result = await request(app)
      .post(`/api/orgs/${ctx.organization.id}/campaigns/${campaign.id}/send`)
      .set("Authorization", `Bearer ${ctx.accessToken}`);
    expect(result.status).toBe(404);
    expect((await Campaign.findById(campaign.id))?.status).toBe("DRAFT");
    expect(await CampaignRecipient.countDocuments({ campaignId: campaign.id })).toBe(0);
  });
});

describe("Transport discovery", () => {
  beforeAll(setupTestDb);
  afterAll(teardownTestDb);
  beforeEach(clearTestDb);

  it("finds verified transports created after initial discovery", async () => {
    const { discoverTransportWorkers, getActiveWorkers } = await import("../../worker.js");
    const { getSendQueueName } = await import("../../queue/names.js");
    await discoverTransportWorkers();
    const ctx = await seedTestContext();
    await discoverTransportWorkers();
    expect(getActiveWorkers().has(getSendQueueName(ctx.transport.id))).toBe(true);
  });
});
