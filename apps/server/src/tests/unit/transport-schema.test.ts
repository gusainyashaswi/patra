import { describe, expect, it } from "vitest";
import { createTransportBody } from "../../schemas/transport.schema.js";

describe("transport creation schema", () => {
  it("accepts the supported Resend provider only", () => {
    expect(createTransportBody.safeParse({ name: "Primary", type: "RESEND", apiKey: "re_test" }).success).toBe(true);
    expect(createTransportBody.safeParse({ name: "SMTP", type: "SMTP", apiKey: "secret" }).success).toBe(false);
    expect(createTransportBody.safeParse({ name: "SES", type: "SES", apiKey: "secret" }).success).toBe(false);
  });
});
