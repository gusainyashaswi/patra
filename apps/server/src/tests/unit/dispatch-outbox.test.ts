import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  campaignUpdate: vi.fn(),
  recipientFind: vi.fn(),
  outboxFindOneAndUpdate: vi.fn(),
  outboxUpdate: vi.fn(),
  queueAddBulk: vi.fn(),
}));

vi.mock("../../models/campaign.model.js", () => ({
  Campaign: { updateOne: mocks.campaignUpdate },
  CampaignRecipient: { find: mocks.recipientFind },
}));
vi.mock("../../models/infra.model.js", () => ({
  DispatchOutboxEvent: {
    findOneAndUpdate: mocks.outboxFindOneAndUpdate,
    updateOne: mocks.outboxUpdate,
  },
}));
vi.mock("../../queue/send.queue.js", () => ({
  getSendQueue: () => ({ addBulk: mocks.queueAddBulk }),
}));

import { dispatchOutboxEvent } from "../../services/dispatchOutbox.service.js";

const event = {
  _id: "outbox_1",
  campaignId: { toString: () => "campaign_1" },
  organizationId: { toString: () => "organization_1" },
  transportId: { toString: () => "transport_1" },
};

describe("dispatchOutboxEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.outboxFindOneAndUpdate.mockResolvedValue(event);
    mocks.recipientFind.mockReturnValue({
      select: () => ({ lean: async () => [{ _id: { toString: () => "recipient_1" } }] }),
    });
  });

  it("marks the outbox event and campaign dispatched after queueing", async () => {
    mocks.queueAddBulk.mockResolvedValue([]);

    await expect(dispatchOutboxEvent("outbox_1")).resolves.toBe(true);
    expect(mocks.queueAddBulk).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ opts: { jobId: "recipient_1" } }),
    ]));
    expect(mocks.outboxUpdate).toHaveBeenCalledWith(
      { _id: "outbox_1", status: "PENDING" },
      expect.objectContaining({ $set: expect.objectContaining({ status: "DISPATCHED" }) }),
    );
  });

  it("keeps the event pending and records the error when Redis is unavailable", async () => {
    mocks.queueAddBulk.mockRejectedValue(new Error("Redis unavailable"));

    await expect(dispatchOutboxEvent("outbox_1")).resolves.toBe(false);
    expect(mocks.outboxUpdate).toHaveBeenCalledWith(
      { _id: "outbox_1" },
      { $set: { lastError: "Redis unavailable" } },
    );
  });
});
