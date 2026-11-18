import { api, API_URL } from "./api";
import type { Workspace } from "./workspace-api";

export { useWorkspace as useTemplateWorkspace, workspaceRequest as templateRequest } from "./workspace-api";

export interface TemplateBlock {
  id?: string;
  type: string;
  [key: string]: unknown;
}

export interface TemplateDraft {
  name: string;
  subject: string;
  previewText?: string;
  page: Record<string, unknown>;
  blocks: TemplateBlock[];
}

export function draftContent({ name, subject, previewText, page, blocks }: TemplateDraft): TemplateDraft {
  return { name, subject, previewText, page, blocks };
}

export async function uploadTemplateImage(workspace: Workspace, file: File): Promise<string> {
  if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 2 * 1024 * 1024) {
    throw new Error("Choose a PNG or JPEG no larger than 2 MB.");
  }
  const { data } = await api<{ path: string }>(`/orgs/${workspace.org.id}/uploads`, { method: "POST", body: file });
  return `${API_URL.replace(/\/$/, "")}${data.path}`;
}
