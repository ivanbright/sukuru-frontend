const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
let refreshInFlight = null;

export function readStoredSession() {
  try { return JSON.parse(localStorage.getItem("sukuru-session") || "null"); }
  catch { return null; }
}

export function writeStoredSession(session) {
  try { localStorage.setItem("sukuru-session", JSON.stringify(session)); }
  catch { /* callers can continue with the in-memory session */ }
}

export function clearStoredSession() {
  try { localStorage.removeItem("sukuru-session"); }
  catch { /* storage may be unavailable */ }
}

export function endSession(session) {
  const current = session || readStoredSession();
  clearStoredSession();
  if (!current?.refreshToken) return;
  fetch(`${API}/api/v1/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: current.refreshToken }),
    cache: "no-store",
    keepalive: true,
  }).catch(() => {});
}

export function refreshSession(activeSession) {
  if (!refreshInFlight) {
    const refreshUnderLock = async () => {
      const latest = readStoredSession() || activeSession;
      if (!latest?.refreshToken) return null;

      // Another tab may have already rotated this session while this tab waited.
      if (activeSession?.refreshToken && latest.refreshToken !== activeSession.refreshToken) return latest;

      let response;
      try {
        response = await fetch(`${API}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: latest.refreshToken }),
          cache: "no-store",
        });
      } catch { return null; }
      if (!response.ok) return null;

      let tokens;
      try { tokens = await response.json(); } catch { return null; }
      if (!tokens?.accessToken || !tokens?.refreshToken) return null;

      const current = readStoredSession();
      // Do not restore a session after the user signed out while refresh was pending.
      if (!current) return null;
      if (current.refreshToken !== latest.refreshToken) return current;
      const next = { ...latest, ...tokens };
      writeStoredSession(next);
      return next;
    };

    const execute = () => typeof navigator !== "undefined" && navigator.locks?.request
      ? navigator.locks.request("sukuru-session-refresh", refreshUnderLock)
      : refreshUnderLock();
    refreshInFlight = execute().finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}
