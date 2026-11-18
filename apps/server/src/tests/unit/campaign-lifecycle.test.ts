import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeCampaignIfFinished } from "../../services/campaignLifecycle.service.js";

const { exists, updateOne } = vi.hoisted(() => ({
  exists: vi.fn(),
  updateOne: vi.fn(),
}));

vi.mock("../../models/campaign.model.js", () => ({
  Campaign: { updateOne },
  CampaignRecipient: { exists },
}));

describe("completeCampaignIfFinished", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not complete while a recipient is still queued", async () => {
    exists.mockResolvedValue({ _id: "recipient_1" });

    await expect(completeCampaignIfFinished("campaign_1")).resolves.toBe(false);
    expect(updateOne).not.toHaveBeenCalled();
  });

  it("atomically completes when every recipient is terminal", async () => {
    exists.mockResolvedValue(null);
    updateOne.mockResolvedValue({ modifiedCount: 1 });

    await expect(completeCampaignIfFinished("campaign_1")).resolves.toBe(true);
    expect(updateOne).toHaveBeenCalledWith(
      { _id: "campaign_1", status: { $in: ["QUEUED", "SENDING"] } },
      { $set: { status: "COMPLETED", completedAt: expect.any(Date) } },
    );
  });
});
