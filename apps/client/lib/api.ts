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
  responseType?: "blob";
}

export class ApiClientError extends Error {
  status?: number;
}

export async function api<T>(path: string, { method = "GET", body, responseType }: ApiOptions = {}): Promise<ApiEnvelope<T> | Blob> {
  const binary = typeof Blob !== "undefined" && body instanceof Blob;
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers: { "Content-Type": binary ? body.type || "application/octet-stream" : "application/json" },
      body: binary ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the Patra API. Is the server running on port 5001?");
  }
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
