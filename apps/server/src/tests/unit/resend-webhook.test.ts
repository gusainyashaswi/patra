import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyResendWebhook } from "../../services/resendWebhook.service.js";

const webhookSecret = `whsec_${Buffer.from("a webhook signing secret").toString("base64")}`;

function signedHeaders(body: string) {
  const id = "msg_01HZY1ABCD";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", Buffer.from(webhookSecret.slice(6), "base64"))
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
  return { id, timestamp, signature: `v1,${signature}` };
}

describe("verifyResendWebhook", () => {
  it("accepts an authentic Svix-signed raw payload", () => {
    const body = JSON.stringify({ type: "email.delivered", data: { email_id: "email_123" } });
    expect(verifyResendWebhook(Buffer.from(body), signedHeaders(body), webhookSecret)).toMatchObject({
      type: "email.delivered",
      data: { email_id: "email_123" },
    });
  });

  it("rejects a payload whose raw bytes were changed", () => {
    const body = JSON.stringify({ type: "email.delivered", data: { email_id: "email_123" } });
    expect(() => verifyResendWebhook(Buffer.from(`${body} `), signedHeaders(body), webhookSecret)).toThrow(
      "Invalid Svix signature",
    );
  });
});
