import { useEffect, useState } from "react";
import { api } from "./api";

export function useWorkspace() {
  const [workspace, setWorkspace] = useState(undefined);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    async function load() {
      const storedToken = localStorage.getItem("patra-token");
      const token = storedToken && storedToken !== "undefined" ? storedToken : undefined;
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

export async function workspaceRequest(workspace, path, options) {
  const { data } = await api(`/orgs/${workspace.org.id}${path}`, { ...options, token: workspace.token });
  return data;
}

