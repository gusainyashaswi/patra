import { describe, expect, it } from "vitest";
import { ImportJob } from "../../models/audience.model.js";

describe("ImportJob schema", () => {
  it("uniquely keys results by organization and request ID", () => {
    const indexes = ImportJob.schema.indexes();
    expect(indexes.some(([keys, options]) =>
      keys.organizationId === 1 && keys.requestId === 1 && options.unique === true,
    )).toBe(true);
  });
});
