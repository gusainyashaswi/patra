import { describe, expect, it } from "vitest";
import { generateUnsubscribeToken, verifyUnsubscribeToken } from "../../services/render.service.js";

describe("unsubscribe tokens", () => {
  it("round-trips a valid signed organization and email", () => {
    const token = generateUnsubscribeToken("507f1f77bcf86cd799439011", "Person@Example.com");
    expect(verifyUnsubscribeToken(token)).toEqual({
      valid: true,
      organizationId: "507f1f77bcf86cd799439011",
      email: "person@example.com",
    });
  });

  it("rejects a token whose signed payload was changed", () => {
    const token = generateUnsubscribeToken("507f1f77bcf86cd799439011", "person@example.com");
    const parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    parsed.e = "attacker@example.com";
    const tampered = Buffer.from(JSON.stringify(parsed)).toString("base64url");

    expect(verifyUnsubscribeToken(tampered)).toEqual({ valid: false });
  });
});
