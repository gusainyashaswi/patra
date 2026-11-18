import { describe, expect, it } from "vitest";
import { CampaignRecipient } from "../../models/campaign.model.js";

describe("CampaignRecipient indexes", () => {
  it("indexes stale-recipient reconciliation by status and creation time", () => {
    const indexes = CampaignRecipient.schema.indexes();
    expect(indexes.some(([keys]) => keys.status === 1 && keys.createdAt === 1)).toBe(true);
  });
});
