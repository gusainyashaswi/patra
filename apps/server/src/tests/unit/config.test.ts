import { it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

it("refuses unsafe production secrets and accepts explicit independent secrets", () => {
  const run = (access: string) => spawnSync(process.execPath, ["--import", "tsx", resolve(__dirname, "../../config/env.ts")], { env: { ...process.env, NODE_ENV: "production", ACCESS_TOKEN_SECRET: access, REFRESH_TOKEN_SECRET: "independent-refresh-secret-for-config-check-2026", CREDENTIALS_KEY: "a".repeat(64), MONGODB_URI: "mongodb://127.0.0.1:27017/patra", REDIS_URL: "redis://127.0.0.1:16380" }, encoding: "utf8" });
  expect(run("short").status).not.toBe(0);
  expect(run("independent-access-secret-for-config-check-2026").status).toBe(0);
});
