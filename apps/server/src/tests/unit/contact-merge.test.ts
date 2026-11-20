import { describe, expect, it } from "vitest";
import { contactMergeData, missingMergeFields } from "../../services/contact-merge.js";
import { compileTemplate } from "../../services/render/compile.js";
import type { Draft } from "../../schemas/template.schema.js";

const draft: Draft = {
  name: "Custom fields", subject: "Hello {{name}} from {{department}}", previewText: "{{team}} update",
  page: { bg: "#ffffff", text: "#292524", width: 600, align: "left" },
  blocks: [{ id: "text", type: "text", text: "Department: {{department}}", size: 16, weight: 400 }],
};
describe("CSV merge field contract", () => {
  it("publishes custom CSV fields and marks every used field as required", () => {
    const result = compileTemplate(draft);
    expect(result.variables).toEqual(["name", "department", "team"]);
    expect(result.html).toContain("{{department}}");
    expect(result.text).toContain("{{department}}");
    expect(compileTemplate(draft, true).html).toContain("[Sample department]");
  });
  it("rejects reserved names instead of reading object prototypes", () => {
    expect(() => compileTemplate({ ...draft, subject: "{{constructor}}" })).toThrow("reserved");
    expect(() => compileTemplate({ ...draft, subject: "{{" + "x".repeat(65) + "}}" })).toThrow("64 characters");
  });
  it("normalizes maps and keeps the canonical contact name/email", () => {
    expect(contactMergeData({ name: "Owner", email: "owner@example.test", customFields: new Map([ ["department", "Design"], ["email", "other@example.test"] ]) })).toEqual({ department: "Design", email: "owner@example.test", name: "Owner" });
  });
  it("treats spaces and inherited values as missing but accepts zero", () => {
    expect(missingMergeFields(["department", "constructor", "count"], { department: "  ", count: 0 })).toEqual(["department", "constructor"]);
  });
});
