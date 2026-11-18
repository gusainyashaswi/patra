import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { setupTestDb, teardownTestDb, clearTestDb, seedTestContext } from "../testHelper.js";
import { RefreshToken, User } from "../../models/identity.model.js";

describe("Hashed login sessions", () => {
  beforeAll(setupTestDb);
  afterAll(teardownTestDb);
  beforeEach(clearTestDb);
  it("rotates refresh tokens once and revokes sessions on logout", async () => {
    const ctx = await seedTestContext();
    const login = await request(app).post("/api/auth/login").send({ email: ctx.user.email, password: "Password123!" });
    expect(login.status).toBe(200);
    const original = login.body.data.refreshToken;
    const stored = await RefreshToken.findOne({ userId: ctx.user.id });
    expect(stored?.tokenHash).toHaveLength(64);
    expect(stored?.tokenHash).not.toBe(original);
    expect((await User.findById(ctx.user.id).select("+refreshToken"))?.refreshToken).toBeUndefined();
    const rotate = await request(app).post("/api/auth/refresh").send({ refreshToken: original });
    expect(rotate.status).toBe(200);
    expect(rotate.body.data.refreshToken).not.toBe(original);
    expect((await request(app).post("/api/auth/refresh").send({ refreshToken: original })).status).toBe(401);
    expect((await request(app).post("/api/auth/logout").auth(rotate.body.data.accessToken, { type: "bearer" })).status).toBe(200);
    expect((await request(app).post("/api/auth/refresh").send({ refreshToken: rotate.body.data.refreshToken })).status).toBe(401);
  });
  it("disables public registration by default", async () => {
    expect((await request(app).post("/api/auth/register").send({ email: "unwanted@example.test", password: "Password123!" })).status).toBe(403);
    expect(await User.countDocuments()).toBe(0);
  });
  it("blocks cross-site cookie mutations but accepts the configured browser origin", async () => {
    const ctx = await seedTestContext();
    const login = await request(app).post("/api/auth/login").send({ email: ctx.user.email, password: "Password123!" });
    const cookies = login.headers["set-cookie"];
    expect((await request(app).post("/api/auth/refresh").set("Cookie", cookies).set("Origin", "https://untrusted.example").send({})).status).toBe(403);
    expect((await request(app).post("/api/auth/refresh").set("Cookie", cookies).set("Origin", process.env.CORS_ORIGIN || "http://localhost:3000").send({})).status).toBe(200);
  });

  it("rate-limits repeated login failures", async () => {
    let status = 0;
    for (let i = 0; i < 11; i++) status = (await request(app).post("/api/auth/login").send({ email: "absent@example.test", password: "invalid" })).status;
    expect(status).toBe(429);
  });

});
