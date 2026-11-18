import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { setupTestDb, teardownTestDb, clearTestDb, seedTestContext } from "../testHelper.js";
import { Suppression } from "../../models/audience.model.js";
import { generateUnsubscribeToken } from "../../services/render.service.js";

describe("Unsubscribe links", () => {
  beforeAll(setupTestDb);
  afterAll(teardownTestDb);
  beforeEach(clearTestDb);
  it("requires confirmation and safely handles repeat requests", async () => {
    const ctx = await seedTestContext();
    const email = ctx.contacts[0].email;
    const path = "/api/public/unsubscribe/" + generateUnsubscribeToken(ctx.organization.id, email);
    expect((await request(app).get(path)).status).toBe(200);
    expect(await Suppression.countDocuments()).toBe(0);
    expect((await request(app).post(path).type("form").send({ "List-Unsubscribe": "One-Click" })).status).toBe(200);
    expect((await request(app).post(path)).status).toBe(200);
    expect(await Suppression.countDocuments({ organizationId: ctx.organization.id, email })).toBe(1);
    expect((await request(app).get(path)).text).toContain("You’re unsubscribed");
  });
  it("rejects invalid links and keeps existing bounce reasons", async () => {
    const ctx = await seedTestContext();
    const email = ctx.contacts[0].email;
    const base = "/api/public/unsubscribe/";
    expect((await request(app).post(base + "invalid")).status).toBe(400);
    expect((await request(app).post(base + generateUnsubscribeToken(ctx.organization.id, email, -1))).status).toBe(400);
    await Suppression.create({ organizationId: ctx.organization.id, email, reason: "HARD_BOUNCE" });
    expect((await request(app).post(base + generateUnsubscribeToken(ctx.organization.id, email))).status).toBe(200);
    expect((await Suppression.findOne({ email }))?.reason).toBe("HARD_BOUNCE");
  });
});
