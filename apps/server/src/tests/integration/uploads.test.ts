import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createServer } from "node:http";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../../app.js";
import { setupTestDb, teardownTestDb, clearTestDb, seedTestContext } from "../testHelper.js";

const keys = ["S3_ENDPOINT", "S3_REGION", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_PUBLIC_URL"];
const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
const png = Buffer.from("89504e470d0a1a0a00000000", "hex");
describe("Image object storage", () => {
  beforeAll(setupTestDb);
  afterAll(async () => { for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; } await teardownTestDb(); });
  beforeEach(clearTestDb);
  it("writes a signed S3 request and returns a public image URL", async () => {
    const ctx = await seedTestContext();
    let received: { url?: string; authorization?: string; type?: string; bytes?: Buffer } = {};
    const storage = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", chunk => chunks.push(chunk));
      req.on("end", () => { received = { url: req.url, authorization: req.headers.authorization, type: String(req.headers["content-type"]), bytes: Buffer.concat(chunks) }; res.setHeader("ETag", '"test"'); res.end(); });
    });
    await new Promise<void>(resolve => storage.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${(storage.address() as { port: number }).port}`;
    Object.assign(process.env, { S3_ENDPOINT: base, S3_REGION: "us-east-1", S3_BUCKET: "images", S3_ACCESS_KEY_ID: "test-key", S3_SECRET_ACCESS_KEY: "test-secret", S3_PUBLIC_URL: base + "/images" });
    try {
      const response = await request(app).post(`/api/orgs/${ctx.organization.id}/uploads`).auth(ctx.accessToken, { type: "bearer" }).set("Content-Type", "image/png").send(png);
      expect(response.status).toBe(201);
      expect(response.body.data.url).toContain(`${base}/images/${ctx.organization.id}/`);
      expect(received.authorization).toContain("AWS4-HMAC-SHA256");
      expect(received.type).toBe("image/png");
      expect(received.bytes).toEqual(png);
    } finally { storage.closeAllConnections(); await new Promise<void>(resolve => storage.close(() => resolve())); }
  });
  it("rejects invalid bytes and preserves legacy image URLs", async () => {
    const ctx = await seedTestContext();
    const invalid = await request(app).post(`/api/orgs/${ctx.organization.id}/uploads`).auth(ctx.accessToken, { type: "bearer" }).set("Content-Type", "image/png").send(Buffer.from("not-a-real-image"));
    expect(invalid.status).toBe(400);
    const key = "6fd9bd78-f3e5-4fc4-8110-153174eb5b9b";
    await mongoose.model("ImageAsset").create({ key, organizationId: ctx.organization.id, mime: "image/png", bytes: png });
    const legacy = await request(app).get(`/api/uploads/${key}`);
    expect(legacy.status).toBe(200);
    expect(legacy.body).toEqual(png);
  });
});
