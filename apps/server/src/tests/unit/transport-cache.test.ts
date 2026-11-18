import { afterEach, describe, expect, it, vi } from "vitest";

const findOne = vi.hoisted(() => vi.fn());
vi.mock("../../models/mailTransport.model.js", () => ({ MailTransport: { findOne } }));

import {
  clearTransportCache,
  getOrBuildTransport,
  invalidateTransportCache,
  registerTransport,
} from "../../transports/index.js";

describe("transport adapter cache", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousFakeTransport = process.env.USE_FAKE_TRANSPORT;

  afterEach(() => {
    clearTransportCache();
    findOne.mockReset();
    process.env.NODE_ENV = previousNodeEnv;
    process.env.USE_FAKE_TRANSPORT = previousFakeTransport;
  });

  it("returns a cached adapter before querying Mongo and queries again after invalidation", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.USE_FAKE_TRANSPORT;
    const adapter = { send: vi.fn(), verify: vi.fn().mockResolvedValue(true) };
    registerTransport("transport_1", adapter);

    await expect(getOrBuildTransport("transport_1", "organization_1")).resolves.toBe(adapter);
    expect(findOne).not.toHaveBeenCalled();

    invalidateTransportCache("transport_1");
    findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
    await expect(getOrBuildTransport("transport_1", "organization_1")).rejects.toThrow("not found");
    expect(findOne).toHaveBeenCalledOnce();
  });
});
