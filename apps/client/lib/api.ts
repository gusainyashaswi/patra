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
  token?: string;
}

export class ApiClientError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

let refreshing: Promise<void> | undefined;

const demoCampaigns = campaigns.map((campaign) => ({ ...campaign, counters: { totalRecipients: campaign.counters.total, sentCount: campaign.counters.sent + campaign.counters.delivered, deliveredCount: campaign.counters.delivered, bouncedCount: campaign.counters.bounced, failedCount: campaign.counters.failed } }));
const demoCampaignList = [
  demoCampaigns.find((campaign) => campaign.status === "SENDING"),
  demoCampaigns.find((campaign) => campaign.status === "COMPLETED"),
].filter((campaign): campaign is typeof demoCampaigns[number] => Boolean(campaign));
const demoStartedAt = Date.now();
const demoCampaignState = new Map<string, { status?: string; counters?: typeof demoCampaigns[number]["counters"] }>();
function currentDemoCampaign(campaign: typeof demoCampaigns[number]) {
  const state = demoCampaignState.get(campaign.id);
  const status = state?.status ?? campaign.status;
  if (status !== "SENDING") return { ...campaign, status, counters: state?.counters ?? campaign.counters };
  const progressed = Math.min(240, Math.floor((Date.now() - demoStartedAt) / 2_000) * 8);
  return { ...campaign, counters: {
    ...campaign.counters,
    sentCount: campaign.counters.sentCount + progressed,
    deliveredCount: campaign.counters.deliveredCount + Math.floor(progressed * 0.75),
  }, status };
}
export function clearDemoSession() {
  document.cookie = "patra-demo=; Max-Age=0; Path=/; SameSite=Lax";
}

export const inDemoMode = () => typeof document !== "undefined" && document.cookie.split("; ").includes("patra-demo=1");
const demoOverview = (period: string) => {
  const samples = {
    "7d": { sent: 1974, delivered: 1277, bounced: 24, failed: 9, opened: 976, pending: 412, days: ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"], deliveredSeries: [112, 322, 198, 84, 604, 170, 380], bouncedSeries: [3, 6, 4, 2, 9, 3, 7], failedSeries: [1, 2, 1, 0, 3, 1, 1] },
    "30d": { sent: 8227, delivered: 7040, bounced: 96, failed: 31, opened: 4818, pending: 412, days: ["W1", "W2", "W3", "W4", "Now"], deliveredSeries: [1112, 1560, 1378, 1750, 1240], bouncedSeries: [15, 21, 18, 25, 17], failedSeries: [5, 7, 6, 8, 5] },
    "90d": { sent: 24816, delivered: 21409, bounced: 291, failed: 102, opened: 14862, pending: 412, days: ["Aug", "Sep", "Oct", "Nov"], deliveredSeries: [4920, 5612, 6124, 4753], bouncedSeries: [72, 81, 79, 59], failedSeries: [28, 31, 27, 16] },
  } as const;
  const sample = samples[period as keyof typeof samples] ?? samples["30d"];
  return { period, stats: { sent: sample.sent, delivered: sample.delivered, bounced: sample.bounced, failed: sample.failed, opened: sample.opened, pending: sample.pending }, series: { days: sample.days, delivered: sample.deliveredSeries, bounced: sample.bouncedSeries, failed: sample.failedSeries }, campaigns: demoCampaigns, setup: [], alerts: [] };
};
function demoData(path: string, method: string): unknown | undefined {
  const [pathname, query] = path.split("?");
  if (pathname === "/auth/me") return me;
  if (pathname === "/orgs") return [org];
  const match = pathname.match(/^\/orgs\/[^/]+(.*)$/);
  if (!match) return undefined;
  const resource = match[1] || "/";
  if (resource === "/overview") return demoOverview(new URLSearchParams(query).get("period") ?? "30d");
  if (resource === "/campaigns/options") {
    return {
      versions: templates
        .filter((template) => template.status === "PUBLISHED")
        .map((template) => ({ id: `${template.id}:v${template.latestVersion}`, subject: template.subject, version: template.latestVersion })),
      senders,
      lists,
    };
  }
  if (resource === "/campaigns") return method === "GET" ? demoCampaignList.map(currentDemoCampaign) : currentDemoCampaign(demoCampaigns[0]);
  const campaign = resource.match(/^\/campaigns\/([^/]+)(?:\/(recipients|pause|resume|send))?$/);
  if (campaign) {
    const base = demoCampaigns.find((item) => item.id === campaign[1]) ?? demoCampaigns[0];
    if (campaign[2] === "pause" && method === "POST") {
      const snapshot = currentDemoCampaign(base);
      demoCampaignState.set(base.id, { status: "PAUSED", counters: snapshot.counters });
    }
    if (campaign[2] === "resume" && method === "POST") demoCampaignState.set(base.id, { status: "SENDING" });
    const row = currentDemoCampaign(base);
    if (campaign[2] === "recipients") {
      const params = new URLSearchParams(query);
      const selectedStatus = params.get("status");
      const limit = Math.max(1, Number(params.get("limit") ?? 25));
      const page = Math.max(0, Number(params.get("page") ?? 0));
      const allRows = recipientsFor(row).map((recipient) => ({ ...recipient, status: recipient.status === "PENDING" ? "QUEUED" : recipient.status }));
      const rows = selectedStatus ? allRows.filter((recipient) => recipient.status === selectedStatus) : allRows;
      return { rows: rows.slice(page * limit, (page + 1) * limit), total: rows.length, page, limit };
    }
    return row;
  }
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
        .then(result => {
          if (result.status === 401) throw new ApiClientError("Please sign in again.", 401);
          if (!result.ok) throw new ApiClientError(`Could not refresh your session (${result.status}).`, result.status);
        })
        .finally(() => { refreshing = undefined; });
      await refreshing;
      response = await request();
    }

  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    throw new Error(`Could not connect to the Patra API at ${API_URL}. Check that it is running and reachable.`);
  }
  if (response.ok && responseType === "stream") return response;
  if (response.ok && responseType === "blob") return response.blob();

  const payload = await response.json().catch(() => ({})) as Partial<ApiEnvelope<T>> & { error?: { message?: string } | string };
  if (!response.ok || payload.success === false) {
    const error = new ApiClientError(
      payload.errors?.[0]?.message || payload.message ||
      (typeof payload.error === "string" ? payload.error : payload.error?.message) ||
      `Request failed (${response.status})`,
      response.status,
    );
    throw error;
  }
  return payload as ApiEnvelope<T>;
}
