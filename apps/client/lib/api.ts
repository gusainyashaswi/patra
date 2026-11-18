// Shared, credentialed client for the Express API.
import { campaigns, contacts, domains, lists, me, org, recipientsFor, senders, templates, transports } from "./mock";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export interface ApiEnvelope<T> {
  data: T;
  message?: string;
  success?: boolean;
  errors?: Array<{ message?: string }>;
}

export interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: BodyInit | Record<string, unknown>;
  responseType?: "blob" | "stream";
  signal?: AbortSignal;
}

export class ApiClientError extends Error {
  status?: number;
}

let refreshing: Promise<void> | undefined;

const demoCampaigns = campaigns.map((campaign) => ({ ...campaign, counters: { totalRecipients: campaign.counters.total, sentCount: campaign.counters.sent + campaign.counters.delivered, deliveredCount: campaign.counters.delivered, bouncedCount: campaign.counters.bounced, failedCount: campaign.counters.failed } }));
const inDemoMode = () => typeof document !== "undefined" && document.cookie.includes("patra-demo=1");
function demoData(path: string, method: string): unknown | undefined {
  const [pathname] = path.split("?");
  if (pathname === "/auth/me") return me;
  if (pathname === "/orgs") return [org];
  const match = pathname.match(/^\/orgs\/[^/]+(.*)$/);
  if (!match) return undefined;
  const resource = match[1] || "/";
  if (resource === "/overview") return { period: "7d", stats: { sent: 1974, delivered: 1277, bounced: 24, failed: 9, opened: 976, pending: 412 }, series: { days: ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"], delivered: [112, 322, 198, 84, 604, 170, 380], bounced: [3, 6, 4, 2, 9, 3, 7], failed: [1, 2, 1, 0, 3, 1, 1] }, campaigns: demoCampaigns, setup: [], alerts: [] };
  if (resource === "/campaigns") return method === "GET" ? demoCampaigns : demoCampaigns[0];
  const campaign = resource.match(/^\/campaigns\/([^/]+)(?:\/(recipients|pause|resume|send))?$/);
  if (campaign) { const row = demoCampaigns.find((item) => item.id === campaign[1]) ?? demoCampaigns[0]; if (campaign[2] === "recipients") return { rows: recipientsFor(row).map((recipient) => ({ ...recipient, status: recipient.status === "PENDING" ? "QUEUED" : recipient.status })), total: 40, page: 0, limit: 100 }; return row; }
  if (resource === "/templates") return templates.map((template) => ({ ...template, latestVersionId: template.id }));
  if (resource === "/senders") return senders;
  if (resource === "/domains") return domains;
  if (resource.startsWith("/transports")) return transports;
  if (resource === "/lists") return lists;
  if (/^\/lists\/[^/]+\/estimate$/.test(resource)) return { total: lists[0].count, suppressed: 9, sendable: lists[0].count - 9 };
  if (resource === "/contacts") return { rows: contacts, total: contacts.length, pageSize: 12, counts: { all: contacts.length, active: contacts.length - 4, suppressed: 4 } };
  return undefined;
}

export function api<T>(path: string, options: ApiOptions & { responseType: "stream" }): Promise<Response>;
export function api<T>(path: string, options: ApiOptions & { responseType: "blob" }): Promise<Blob>;
export function api<T>(path: string, options?: ApiOptions): Promise<ApiEnvelope<T>>;
export async function api<T>(path: string, { method = "GET", body, responseType, signal }: ApiOptions = {}): Promise<ApiEnvelope<T> | Blob | Response> {
  if (inDemoMode()) {
    const data = demoData(path, method);
    if (data !== undefined) return { data: data as T };
  }
  const binary = typeof Blob !== "undefined" && body instanceof Blob;
  let response: Response;
  try {
    const request = () => fetch(`${API_URL}${path}`, {
      method, signal, credentials: "include",
      headers: { "Content-Type": binary ? (body as Blob).type || "application/octet-stream" : "application/json" },
      body: binary ? body as Blob : body ? JSON.stringify(body) : undefined,
    });
    response = await request();
    if (response.status === 401 && !["/auth/login", "/auth/refresh", "/auth/register"].includes(path)) {
      refreshing ??= fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" })
        .then(result => { if (!result.ok) throw new Error("Please sign in again."); })
        .finally(() => { refreshing = undefined; });
      await refreshing;
      response = await request();
    }

  } catch {
    throw new Error("Can't reach the Patra API. Is the server running on port 5001?");
  }
  if (response.ok && responseType === "stream") return response;
  if (response.ok && responseType === "blob") return response.blob();

  const payload = await response.json().catch(() => ({})) as Partial<ApiEnvelope<T>> & { error?: { message?: string } | string };
  if (!response.ok || payload.success === false) {
    const error = new ApiClientError(
      payload.errors?.[0]?.message || payload.message ||
      (typeof payload.error === "string" ? payload.error : payload.error?.message) ||
      `Request failed (${response.status})`,
    );
    error.status = response.status;
    throw error;
  }
  return payload as ApiEnvelope<T>;
}
