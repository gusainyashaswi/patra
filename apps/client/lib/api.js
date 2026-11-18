// Shared client for the Express API.

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export async function api(path, { method = "GET", body, token, responseType } = {}) {
  let res;
  const binary = typeof Blob !== "undefined" && body instanceof Blob;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": binary ? body.type || "application/octet-stream" : "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: binary ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the Patra API. Is the server running on port 5001?");
  }
  if (res.ok && responseType === "blob") return res.blob();
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw Object.assign(new Error(data.errors?.[0]?.message || data.message || data.error?.message || `Request failed (${res.status})`), { status: res.status });
  }
  return data;
}
