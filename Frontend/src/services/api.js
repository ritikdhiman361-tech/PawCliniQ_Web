// The one place that talks to the backend. The API is served from the same
// origin (Vite proxies /api in development), and the session lives in an
// httpOnly cookie the browser sends automatically.

// Fired when the server says the session is gone (expired, or logged out in
// another tab); AuthContext listens and clears the user.
export const SESSION_EXPIRED = "pawcliniq:session-expired";

export async function api(path, { method = "GET", body, keepalive } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      keepalive,
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  // Not our API answering (it always sends JSON): in development that's the
  // Vite proxy failing because the backend isn't running.
  if (data === null && !res.ok) {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith("/auth/")) {
      window.dispatchEvent(new Event(SESSION_EXPIRED));
    }
    const error = new Error(data.error || "Something went wrong. Please try again.");
    error.status = res.status;
    throw error;
  }
  return data;
}
