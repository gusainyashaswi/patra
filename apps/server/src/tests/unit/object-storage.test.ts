import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("../../config/env.js", () => ({
  env: {
    S3_ENDPOINT: "https://storage.example.test",
    S3_REGION: "auto",
    S3_BUCKET: "images",
    S3_ACCESS_KEY_ID: "key",
    S3_SECRET_ACCESS_KEY: "secret",
  },
}));
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class { send = mocks.send; },
  PutObjectCommand: class { constructor(readonly input: unknown) {} },
  GetObjectCommand: class { constructor(readonly input: unknown) {} },
}));

import { storeImage } from "../../services/objectStorage.service.js";

describe("object storage", () => {
  beforeEach(() => mocks.send.mockReset());

  it("puts uploaded image bytes into the configured object bucket", async () => {
    mocks.send.mockResolvedValue({});

    await storeImage("images/org_1/image_1", Buffer.from("image bytes"), "image/png");

    expect(mocks.send).toHaveBeenCalledOnce();
    expect(mocks.send.mock.calls[0][0]).toMatchObject({
      input: expect.objectContaining({ Bucket: "images", Key: "images/org_1/image_1", ContentType: "image/png" }),
    });
  });
});
