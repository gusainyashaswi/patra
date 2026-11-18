import { useEffect, useState } from "react";
import { api } from "./api";

export interface Organization {
  id: string;
  name: string;
  slug?: string;
}

export interface Workspace {
  org: Organization;
}

export function useWorkspace(): { workspace: Workspace | undefined; error: Error | null } {
  const [workspace, setWorkspace] = useState<Workspace | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data } = await api<Organization[]>("/orgs");
        if (!data.length) throw new Error("Your account has no organization.");
        const requested = new URLSearchParams(window.location.search).get("org");
        const org = requested ? data.find((item) => item.id === requested) : data[0];
        if (!org) throw new Error("This organization is unavailable.");
        if (active) setWorkspace({ org });
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught : new Error("Could not load your organization."));
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  return { workspace, error };
}

export async function workspaceRequest<T>(workspace: Workspace, path: string, options?: Parameters<typeof api>[1]): Promise<T> {
  const { data } = await api<T>(`/orgs/${workspace.org.id}${path}`, options);
  return data;
}
