export const SESSION_EVENT = "patra-session";
export function sessionToken() {
  const token = localStorage.getItem("patra-token");
  return token && token !== "undefined" ? token : null;
}
export function saveSession(token) {
  localStorage.setItem("patra-token", token);
  window.dispatchEvent(new Event(SESSION_EVENT));
}
export function clearSession() {
  localStorage.removeItem("patra-token");
  window.dispatchEvent(new Event(SESSION_EVENT));
}
