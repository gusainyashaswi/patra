import { sessionToken, saveSession, clearSession } from "./session";

let refreshing;

// Shared client for the Express API.

export const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? `http://${window.location.hostname}:5001/api`
  : "http://localhost:5001/api");

export async function api(path, { method = "GET", body, token, responseType } = {}) {
  const storedToken = typeof window !== "undefined" ? sessionToken() : null;
  const authToken = token ? storedToken ?? token : undefined;
  let res;
  const binary = typeof Blob !== "undefined" && body instanceof Blob;
  try {
    const request = (accessToken) => fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": binary ? body.type || "application/octet-stream" : "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: binary ? body : body ? JSON.stringify(body) : undefined,
    });
    res = await request(authToken);
    if (res.status === 401 && authToken && !["/auth/login", "/auth/refresh", "/auth/register"].includes(path)) {
      if (!refreshing) {
        refreshing = fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" }, body: "{}" })
          .then(async (response) => {
            const result = await response.json();
            const next = result.data?.accessToken;
            if (!response.ok || !next) {
              if (response.status === 401) clearSession();
              throw new Error(result.message || "Please sign in again.");
            }
            if (!sessionToken()) throw new Error("Session ended.");
            saveSession(next);
            return next;
          }).finally(() => { refreshing = null; });
      }
      const nextToken = await refreshing;
      res = await request(nextToken);
    }
  } catch (error) {
    if (error.message !== "Failed to fetch" && error.name !== "TypeError") throw error;
    throw new Error("Can't reach the Patra API. Is the server running on port 5001?");
  }
  if (res.ok && responseType === "blob") return res.blob();
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw Object.assign(new Error(data.errors?.[0]?.message || data.message || data.error?.message || `Request failed (${res.status})`), { status: res.status });
  }
  return data;
}
