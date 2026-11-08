// Thin client for the Express API. Only auth exists on the server today;
// everything else in the UI reads lib/mock.js until those routes land.

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export async function api(path, { method = "GET", body, token } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the Patra API. Is the server running on port 5001?");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw Object.assign(new Error(data.message || data.error || `Request failed (${res.status})`), { status: res.status });
  }
  return data;
}
