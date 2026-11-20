import { blankStarter, starterContent, starters, type StarterContent, type TemplateStarter } from "./template-starters";

const prefix = "patra-template-draft:";
const eventName = "patra-template-drafts-change";

export interface LocalTemplateDraft extends StarterContent {
  id: string;
  status: "DRAFT";
  latestVersion: number;
  updatedAt?: string;
}

function isLocalDraft(value: unknown): value is LocalTemplateDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<LocalTemplateDraft>;
  return typeof draft.id === "string" && Array.isArray(draft.blocks) && Boolean(draft.page);
}

export function readDrafts(): LocalTemplateDraft[] {
  try {
    const drafts: LocalTemplateDraft[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(prefix)) continue;
      try {
        const value: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
        if (isLocalDraft(value) && value.id === key.slice(prefix.length)) drafts.push(value);
      } catch {
        // A malformed entry should not hide other drafts.
      }
    }
    return drafts.sort((left, right) => (right.updatedAt ?? "").localeCompare(left.updatedAt ?? ""));
  } catch {
    return [];
  }
}

export function saveDraft(draft: LocalTemplateDraft): void {
  localStorage.setItem(`${prefix}${draft.id}`, JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
  window.dispatchEvent(new Event(eventName));
}

export function subscribeDrafts(listener: EventListener): () => void {
  window.addEventListener(eventName, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(eventName, listener);
    window.removeEventListener("storage", listener);
  };
}

export function createDraft(starter: TemplateStarter): LocalTemplateDraft {
  const draft: LocalTemplateDraft = {
    ...starterContent(starter),
    id: `local-${crypto.randomUUID()}`,
    status: "DRAFT",
    latestVersion: 0,
  };
  saveDraft(draft);
  return draft;
}

export function ensureStarterDrafts(): void {
  const existing = new Set(readDrafts().map((draft) => draft.id));
  for (const starter of [blankStarter, ...starters]) {
    const id = `local-starter-${starter.id}`;
    if (existing.has(id)) continue;
    saveDraft({
      ...starterContent(starter),
      id,
      status: "DRAFT",
      latestVersion: 0,
    });
  }
}
