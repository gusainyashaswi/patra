// Shared, credentialed client for the Express API.

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

export function api<T>(path: string, options: ApiOptions & { responseType: "stream" }): Promise<Response>;
export function api<T>(path: string, options: ApiOptions & { responseType: "blob" }): Promise<Blob>;
export function api<T>(path: string, options?: ApiOptions): Promise<ApiEnvelope<T>>;
export async function api<T>(path: string, { method = "GET", body, responseType, signal }: ApiOptions = {}): Promise<ApiEnvelope<T> | Blob | Response> {
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
