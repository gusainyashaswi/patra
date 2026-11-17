import { starterContent } from "./template-starters.js";

const prefix = "patra-template-draft:";
const eventName = "patra-template-drafts-change";

export function readDrafts() {
  try {
    const drafts = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(prefix)) continue;
      try {
        const draft = JSON.parse(localStorage.getItem(key));
        if (draft?.id === key.slice(prefix.length) && Array.isArray(draft.blocks) && draft.page) {
          drafts.push(draft);
        }
      } catch {
        // A malformed entry should not hide other drafts.
      }
    }
    return drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export function saveDraft(draft) {
  localStorage.setItem(prefix + draft.id, JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
  window.dispatchEvent(new Event(eventName));
}

export function subscribeDrafts(listener) {
  window.addEventListener(eventName, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(eventName, listener);
    window.removeEventListener("storage", listener);
  };
}

export function createDraft(starter) {
  const draft = {
    ...starterContent(starter),
    id: `local-${crypto.randomUUID()}`,
    status: "DRAFT",
    latestVersion: 0,
  };
  saveDraft(draft);
  return draft;
}
