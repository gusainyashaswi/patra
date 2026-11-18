import { api, API_URL } from "./api";
export { useWorkspace as useTemplateWorkspace, workspaceRequest as templateRequest } from "./workspace-api";

export function draftContent({ name, subject, previewText, page, blocks }) {
  return { name, subject, previewText, page, blocks };
}

export async function uploadTemplateImage(workspace, file) {
  if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 2 * 1024 * 1024) {
    throw new Error("Choose a PNG or JPEG no larger than 2 MB.");
  }
  const path = `/orgs/${workspace.org.id}/uploads`;
  const { data } = await api(path, { token: workspace.token, method: "POST", body: file });
  if (data.url) return data.url;
  return `${API_URL.replace(/\/$/, "")}${data.path}`;
}
