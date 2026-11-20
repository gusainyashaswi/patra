// Use the same merge data for estimates and the queued recipient snapshot.
export function contactMergeData(contact: { email: string; name?: string; customFields?: unknown }): Record<string, string> {
  const fields = contact.customFields instanceof Map ? Object.fromEntries(contact.customFields) : contact.customFields;
  const data: Record<string, string> = {};
  if (fields && typeof fields === "object") {
    for (const [key, value] of Object.entries(fields)) {
      if (["__proto__", "prototype", "constructor"].includes(key)) continue;
      if (["string", "number", "boolean"].includes(typeof value)) data[key] = String(value);
    }
  }
  return { ...data, name: contact.name ?? "", email: contact.email };
}

export function missingMergeFields(variables: string[], data: Record<string, unknown>) {
  return variables.filter(key => !Object.hasOwn(data, key) || data[key] == null || String(data[key]).trim() === "");
}
