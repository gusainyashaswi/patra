import { it, expect, vi, afterEach } from "vitest";
import { MailtrapSandbox } from "../load/mailtrap-sandbox.js";
const message = { to: "load-1@example.test", from: '"Local" <hello@example.test>', subject: "Load check", html: "<p>Test</p>", text: "Test", idempotencyKey: "load:1" };
afterEach(() => vi.unstubAllGlobals());
it("uses only the sandbox and reuses successful in-process results", async () => {
  const send = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, message_ids: ["sandbox-id"] }), { status: 200 }));
  vi.stubGlobal("fetch", send);
  const adapter = new MailtrapSandbox("test-token", "123");
  expect((await adapter.send(message)).providerMessageId).toBe("sandbox-id");
  await adapter.send(message);
  expect(send).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0][0]).toBe("https://sandbox.api.mailtrap.io/api/send/123");
  await expect(adapter.send({ ...message, to: "real@example.com" })).rejects.toThrow("example.test");
});
it("fails uncertain sandbox requests without automatic delivery retries", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
  await expect(new MailtrapSandbox("test-token", "123").send(message)).rejects.toThrow("check its limits");
});
