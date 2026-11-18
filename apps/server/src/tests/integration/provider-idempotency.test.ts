import { it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupTestDb, teardownTestDb, clearTestDb } from "../testHelper.js";
import { FakeMailTransport } from "../../transports/fake.transport.js";
import { getRedisConnection } from "../../lib/redis.js";
beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(clearTestDb);
it("models provider deduplication across fresh adapter instances", async () => {
  const message = { to: "one@example.test", from: "hello@example.test", subject: "Same message", html: "<p>Same</p>", text: "Same", idempotencyKey: "provider-check" };
  const first = new FakeMailTransport();
  const restarted = new FakeMailTransport();
  const [one, two] = await Promise.all([first.send(message), restarted.send(message)]);
  expect(one.providerMessageId).toBe(two.providerMessageId);
  expect(await getRedisConnection().hget("fake_transport:counts", message.idempotencyKey)).toBe("1");
  await expect(restarted.send({ ...message, subject: "Changed content" })).rejects.toThrow("different email content");
});
