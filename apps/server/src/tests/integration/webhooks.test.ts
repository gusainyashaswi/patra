import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { Webhook } from "svix";
import { app } from "../../app.js";
import { setupTestDb, teardownTestDb, clearTestDb, seedTestContext } from "../testHelper.js";
import { Campaign, CampaignRecipient } from "../../models/campaign.model.js";
import { WebhookEvent } from "../../models/infra.model.js";
import { TestEmail } from "../../models/test-email.model.js";
import { Suppression } from "../../models/audience.model.js";

const secret = "whsec_" + Buffer.from("local-webhook-test-secret").toString("base64");
const previousSecret = process.env.RESEND_WEBHOOK_SECRET;
function send(type: string, id: string, data: object = {}, message = "msg_test", signed = true) {
  const date = new Date();
  const body = JSON.stringify({ type, created_at: date.toISOString(), data: { email_id: message, ...data } });
  return request(app).post("/api/webhooks/resend").set("Content-Type", "application/json")
    .set("svix-id", id).set("svix-timestamp", String(Math.floor(date.getTime() / 1000)))
    .set("svix-signature", signed ? new Webhook(secret).sign(id, date, body) : "v1,invalid").send(body);
}
async function fixture() {
  const ctx = await seedTestContext();
  const campaign = await Campaign.create({ organizationId: ctx.organization.id, name: "Tracking", status: "SENDING", templateVersionId: ctx.templateVersion.id, senderIdentityId: ctx.sender.id, listId: ctx.list.id });
  const recipient = await CampaignRecipient.create({ organizationId: ctx.organization.id, campaignId: campaign.id, contactId: ctx.contacts[0].id, email: ctx.contacts[0].email, status: "SENT", providerMessageId: "msg_test", sentAt: new Date() });
  return { campaign, recipient };
}
describe("Resend webhooks", () => {
  beforeAll(async () => { process.env.RESEND_WEBHOOK_SECRET = secret; await setupTestDb(); await WebhookEvent.init(); });
  afterAll(async () => { if (previousSecret === undefined) delete process.env.RESEND_WEBHOOK_SECRET; else process.env.RESEND_WEBHOOK_SECRET = previousSecret; await teardownTestDb(); });
  beforeEach(clearTestDb);
  it("rejects forged signatures before writing anything", async () => {
    expect((await send("email.delivered", "bad", {}, "msg_test", false)).status).toBe(401);
    expect(await WebhookEvent.countDocuments()).toBe(0);
  });
  it("deduplicates concurrent deliveries and never moves engagement backwards", async () => {
    const { campaign, recipient } = await fixture();
    const response = await send("email.clicked", "clicked");
    expect(response.body).toEqual({ received: true });
    const results = await Promise.all([send("email.delivered", "delivery"), send("email.delivered", "delivery")]);
    expect(results.map(r => r.status)).toEqual([200, 200]);
    expect((await send("email.delivered", "delivery-again")).status).toBe(200);
    expect((await send("email.opened", "opened")).status).toBe(200);
    expect((await CampaignRecipient.findById(recipient.id))?.status).toBe("CLICKED");
    expect((await Campaign.findById(campaign.id))?.counters.deliveredCount).toBe(1);
    expect(await WebhookEvent.countDocuments()).toBe(4);
  });
  it("suppresses permanent bounces once and preserves terminal status on late delivery", async () => {
    const { campaign, recipient } = await fixture();
    expect((await send("email.bounced", "bounce", { bounce: { type: "Permanent", message: "Invalid mailbox" } })).status).toBe(200);
    expect((await send("email.bounced", "bounce-again", { bounce: { type: "Permanent" } })).status).toBe(200);
    expect((await send("email.delivered", "late-delivery")).status).toBe(200);
    expect((await CampaignRecipient.findById(recipient.id))?.status).toBe("BOUNCED");
    expect((await Campaign.findById(campaign.id))?.counters.bouncedCount).toBe(1);
    expect(await Suppression.countDocuments({ organizationId: recipient.organizationId, email: recipient.email, reason: "HARD_BOUNCE" })).toBe(1);
  });
  it("suppresses complaints, but not transient bounces", async () => {
    const { recipient } = await fixture();
    expect((await send("email.bounced", "soft", { bounce: { type: "Transient" } })).status).toBe(200);
    expect(await Suppression.countDocuments()).toBe(0);
    expect((await send("email.complained", "complaint")).status).toBe(200);
    expect((await CampaignRecipient.findById(recipient.id))?.status).toBe("COMPLAINED");
    expect((await Suppression.findOne({ email: recipient.email }))?.reason).toBe("COMPLAINT");
  });
  it("leaves unmatched events retryable and accepts them after the worker stores the ID", async () => {
    expect((await send("email.delivered", "early")).status).toBe(503);
    expect(await WebhookEvent.countDocuments()).toBe(0);
    await fixture();
    expect((await send("email.delivered", "early")).status).toBe(200);
  });
  it("counts failures once and acknowledges unrelated events", async () => {
    const { campaign, recipient } = await fixture();
    expect((await send("email.failed", "failed", { failed: { reason: "quota" } })).status).toBe(200);
    expect((await send("email.failed", "failed-new", { failed: { reason: "quota" } })).status).toBe(200);
    expect((await Campaign.findById(campaign.id))?.counters.failedCount).toBe(1);
    expect((await CampaignRecipient.findById(recipient.id))?.error).toBe("quota");
    expect((await send("email.received", "inbound")).status).toBe(200);
  });
  it("acknowledges tracked test mail without campaign counter changes", async () => {
    const { campaign, recipient } = await fixture();
    await TestEmail.create({ organizationId: recipient.organizationId, requestId: "test-request", recipient: recipient.email, providerMessageId: "test-message" });
    expect((await send("email.delivered", "test-delivery", {}, "test-message")).status).toBe(200);
    expect((await TestEmail.findOne({ providerMessageId: "test-message" }))?.status).toBe("DELIVERED");
    expect((await Campaign.findById(campaign.id))?.counters.deliveredCount).toBe(0);
  });

});
