import { describe, expect, it } from "vitest";
import { draftSchema } from "../../schemas/template.schema.js";
import { compileTemplate } from "../../services/render/compile.js";

const makeDraft = (text: string) =>
  draftSchema.parse({
    name: "Custom fields",
    subject: "Update for {{account_owner}}",
    previewText: "Account {{account_id}}",
    page: { bg: "#ffffff", text: "#111111", align: "left", width: 600 },
    blocks: [{
      id: "body",
      type: "text",
      text,
      size: 16,
      weight: 400,
    }],
  });

describe("compileTemplate", () => {
  it("accepts dynamically discovered CRM variables", () => {
    const compiled = compileTemplate(makeDraft("Hello {{first_name}}, your balance is {{account_balance}}."));

    expect(compiled.variables).toEqual(["account_owner", "account_id", "first_name", "account_balance"]);
  });

  it("rejects malformed variable names", () => {
    expect(() => compileTemplate(makeDraft("Hello {{first-name}}."))).toThrow(
      "Invalid variable name \"first-name\"",
    );
  });
});
