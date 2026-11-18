import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../app.js";

describe("health endpoints", () => {
  it("reports liveness without requiring MongoDB", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", service: "patra-api" });
  });

  it("reports readiness as unavailable when MongoDB is disconnected", async () => {
    const response = await request(app).get("/ready");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: "not_ready",
      dependencies: { mongodb: "not_ready" },
    });
  });
});
