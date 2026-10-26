export function accessTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const encoded = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(encoded));
    return typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function createAuthRequest(deps: {
  fetch: (path: string, options: any) => Promise<any>;
  token: () => string | null;
  refresh: () => Promise<void>;
  unauthenticated: () => Promise<void>;
}) {
  return async (path: string, options: any = {}) => {
    const send = (token: string | null) => {
      const headers = new Headers(options.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Accept", options.responseType === "blob" ? "text/csv" : "application/json");
      headers.set("Content-Type", "application/json");
      return deps.fetch(path, { ...options, headers, credentials: "include" });
    };
    const token = deps.token();
    try {
      return await send(token);
    } catch (error: any) {
      const status = error?.response?.status ?? error?.statusCode;
      if (status !== 401 || !accessTokenExpired(token)) throw error;
      try {
        // Another request may already have refreshed while this one was pending.
        if (deps.token() === token || !deps.token()) await deps.refresh();
      } catch {
        await deps.unauthenticated();
        throw error;
      }
      try {
        return await send(deps.token());
      } catch (retryError: any) {
        if ((retryError?.response?.status ?? retryError?.statusCode) === 401) {
          await deps.unauthenticated();
        }
        throw retryError;
      }
    }
  };
}

// Serialize cookie rotation across tabs as well as within this SPA.
export function withAuthCookieLock<T>(run: () => Promise<T>): Promise<T> {
  return typeof navigator !== "undefined" && navigator.locks
    ? navigator.locks.request("igameforge-auth-cookie", run)
    : run();
}
