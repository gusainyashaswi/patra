import { useEffect, useState } from "react";
import { api, API_URL } from "./api";

export function useTemplateWorkspace() {
  const [workspace, setWorkspace] = useState(undefined);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    async function load() {
      const token = localStorage.getItem("patra-token");
      if (!token || token === "undefined") {
        if (active) setWorkspace(null);
        return;
      }
      try {
        const { data } = await api("/orgs", { token });
        if (!data.length) throw new Error("Your account has no organization.");
        const requested = new URLSearchParams(location.search).get("org");
        const org = requested ? data.find((item) => item.id === requested) : data[0];
        if (!org) throw new Error("This organization is unavailable.");
        if (active) setWorkspace({ token, org });
      } catch (error) {
        if (active) setError(error);
      }
    }
    load();
    return () => { active = false; };
  }, []);
  return { workspace, error };
}

export async function templateRequest(workspace, path, options) {
  const { data } = await api(`/orgs/${workspace.org.id}${path}`, { ...options, token: workspace.token });
  return data;
}

export function draftContent({ name, subject, previewText, page, blocks }) {
  return { name, subject, previewText, page, blocks };
}

export async function uploadTemplateImage(workspace, file) {
  if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 2 * 1024 * 1024) {
    throw new Error("Choose a PNG or JPEG no larger than 2 MB.");
  }
  const path = `/orgs/${workspace.org.id}/uploads`;
  const { data } = await api(path, { token: workspace.token, method: "POST", body: file });
  return `${API_URL.replace(/\/$/, "")}${data.path}`;
}
