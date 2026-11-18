import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import {
  setupTestDb,
  teardownTestDb,
  clearTestDb,
  seedTestContext,
} from "../testHelper.js";
import { Campaign, CampaignRecipient } from "../../models/campaign.model.js";
import { Contact, List } from "../../models/audience.model.js";
import { startSend } from "../../services/send.service.js";
import { getRedisConnection } from "../../lib/redis.js";

describe("Kill Test: Mid-Send Worker Termination & Recovery", () => {
  let ctx: Awaited<ReturnType<typeof seedTestContext>>;
  let mongoUri: string;

  beforeAll(async () => {
    mongoUri = await setupTestDb();
  }, 45000);

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    ctx = await seedTestContext();
  });

  it(
    "creates 100 recipients, kills worker mid-send with SIGKILL, restarts it, and ensures zero duplicates",
    async () => {
      const TOTAL = 100;

      // 1. Create 100 contacts
      const contactDocs = Array.from({ length: TOTAL }, (_, i) => ({
        organizationId: ctx.organization._id,
        name: `Contact ${i + 1}`,
        email: `recipient_${i + 1}_${Date.now()}@test.com`,
        customFields: { ticket: `TCK-${1000 + i}` },
      }));

      const createdContacts = await Contact.insertMany(contactDocs);

      // Create list with all 100 contacts
      const list = await List.create({
        organizationId: ctx.organization._id,
        name: "100 Recipients List",
        contactIds: createdContacts.map((c) => c._id),
      });

      // Create campaign in DRAFT
      const campaign = await Campaign.create({
        organizationId: ctx.organization._id,
        name: "100 Recipient Resiliency Test",
        templateVersionId: ctx.templateVersion._id,
        senderIdentityId: ctx.sender._id,
        listId: list._id,
        status: "DRAFT",
      });

      // 2. Queue the campaign via startSend
      const sendResult = await startSend(
        ctx.organization._id.toString(),
        campaign._id.toString(),
      );

      expect(sendResult.totalRecipients).toBe(TOTAL);
      expect(sendResult.queuedCount).toBe(TOTAL);

      const serverDir = path.resolve(__dirname, "../../..");
      const workerScript = path.resolve(serverDir, "src/worker.ts");

      const childEnv = {
        ...process.env,
        MONGODB_URI: mongoUri,
        REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
        NODE_ENV: "test",
        USE_FAKE_TRANSPORT: "true",
        WORKER_CONCURRENCY: "5",
        WORKER_LOCK_MS: "2000",
        PATRA_RUN_WORKER: "true",
      };

      // 3. Start worker process 1
      let worker1: ChildProcess | null = spawn(
        process.execPath,
        ["--import", "tsx", workerScript],
        {
          cwd: serverDir,
          env: childEnv,
          stdio: "inherit",
        },
      );

      // 4. Poll until about 30 sends have been completed
      await new Promise<void>((resolve) => {
        const interval = setInterval(async () => {
          const sentSoFar = await CampaignRecipient.countDocuments({
            campaignId: campaign._id,
            status: "SENT",
          });
          if (sentSoFar >= 25) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });

      // 5. Hard kill worker 1 with SIGKILL
      const killResult = worker1.kill("SIGKILL");
      expect(killResult).toBe(true);
      worker1 = null;

      // Small pause to simulate crash downtime
      await new Promise((r) => setTimeout(r, 800));

      // 6. Start worker process 2 to recover and drain queue
      const worker2: ChildProcess = spawn(
        process.execPath,
        ["--import", "tsx", workerScript],
        {
          cwd: serverDir,
          env: childEnv,
          stdio: "inherit",
        },
      );

      // 7. Wait for all 100 recipients to reach final status (SENT)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          clearInterval(interval);
          reject(new Error("Timed out waiting for 100 recipients to complete"));
        }, 35000);

        const interval = setInterval(async () => {
          const sentCount = await CampaignRecipient.countDocuments({
            campaignId: campaign._id,
            status: "SENT",
          });
          if (sentCount >= TOTAL) {
            clearTimeout(timeout);
            clearInterval(interval);
            resolve();
          }
        }, 300);
      });

      // Stop worker 2
      worker2.kill("SIGTERM");

      // 8. Final assertions
      // a) Every recipient is in final status SENT
      const allRecipients = await CampaignRecipient.find({
        campaignId: campaign._id,
      });
      expect(allRecipients.length).toBe(TOTAL);
      for (const r of allRecipients) {
        expect(r.status).toBe("SENT");
        expect(r.providerMessageId).toBeDefined();
      }

      // b) No idempotency key was sent more than once to fake transport
      const redis = getRedisConnection();
      const sendCounts = await redis.hgetall("fake_transport:counts");

      const keys = Object.keys(sendCounts);
      expect(keys.length).toBe(TOTAL);

      for (const key of keys) {
        const count = Number(sendCounts[key]);
        expect(count).toBe(1); // Crucial: ZERO duplicate sends!
      }

      // c) Campaign counters match recipient rows
      const freshCampaign = await Campaign.findById(campaign._id);
      expect(freshCampaign?.counters.sentCount).toBe(TOTAL);
      expect(freshCampaign?.counters.failedCount).toBe(0);
    },
    60000,
  );
});
