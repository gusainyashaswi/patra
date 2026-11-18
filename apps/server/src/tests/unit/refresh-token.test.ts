import { describe, expect, it } from "vitest";
import { hashRefreshToken } from "../../controllers/auth.controller.js";

describe("refresh-token storage", () => {
  it("hashes tokens deterministically without retaining their plaintext", () => {
    const token = "refresh-token-value";
    const hash = hashRefreshToken(token);

    expect(hash).not.toBe(token);
    expect(hash).toHaveLength(64);
    expect(hashRefreshToken(token)).toBe(hash);
    expect(hashRefreshToken("another-refresh-token")).not.toBe(hash);
  });
});
