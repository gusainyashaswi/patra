import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  senderFindOne: vi.fn(),
  domainFindOne: vi.fn(),
  getOrBuildTransport: vi.fn(),
  send: vi.fn(),
}));

vi.mock("../../models/mailTransport.model.js", () => ({
  SenderIdentity: { findOne: mocks.senderFindOne },
  Domain: { findOne: mocks.domainFindOne },
}));
vi.mock("../../transports/index.js", () => ({
  getOrBuildTransport: mocks.getOrBuildTransport,
}));

import { sendTemplateTest } from "../../services/template-test.service.js";

describe("sendTemplateTest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.senderFindOne.mockResolvedValue({
      domainId: "domain_1",
      displayName: "Patra",
      fromEmail: "hello@example.com",
      replyTo: "reply@example.com",
    });
    mocks.domainFindOne.mockResolvedValue({ _id: "domain_1", transportId: "transport_1" });
    mocks.getOrBuildTransport.mockResolvedValue({ send: mocks.send });
    mocks.send.mockResolvedValue({ providerMessageId: "email_123" });
  });

  it("uses the configured transport adapter with a stable idempotency key", async () => {
    await expect(sendTemplateTest(
      "organization_1", "sender_1", "person@example.com", "request_1",
      { subject: "Hello", html: "<p>Hello</p>", text: "Hello" },
    )).resolves.toEqual({ id: "email_123", recipient: "person@example.com" });

    expect(mocks.getOrBuildTransport).toHaveBeenCalledWith("transport_1", "organization_1");
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({
      to: "person@example.com",
      idempotencyKey: "template-test/organization_1/request_1",
    }));
  });
});
