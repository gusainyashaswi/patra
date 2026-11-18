import { describe, expect, it } from "vitest";
import { SenderIdentity } from "../../models/mailTransport.model.js";

describe("SenderIdentity schema", () => {
  it("uses domainId as its only transport relationship", () => {
    expect(SenderIdentity.schema.path("domainId")).toBeDefined();
    expect(SenderIdentity.schema.path("transportId")).toBeUndefined();
  });
});
