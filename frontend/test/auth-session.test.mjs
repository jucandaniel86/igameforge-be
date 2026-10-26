import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { createPinia, setActivePinia } from "pinia";

const moduleURL = (source) =>
  "data:text/javascript;base64," +
  Buffer.from(stripTypeScriptTypes(source, { mode: "transform" })).toString("base64");
const helperURL = moduleURL(
  readFileSync(new URL("../utils/auth-request.ts", import.meta.url), "utf8"),
);
const { createAuthRequest, accessTokenExpired } = await import(helperURL);
const storeSource = readFileSync(new URL("../store/auth.ts", import.meta.url), "utf8")
  .replace(/from ["']pinia["']/, `from ${JSON.stringify(import.meta.resolve("pinia"))}`)
  .replace(/from ["']~\/utils\/auth-request["']/, `from ${JSON.stringify(helperURL)}`)
  .replaceAll("import.meta.client", "true");
const { useAuthStore } = await import(moduleURL(storeSource));
const token = (expired) =>
  "header." +
  Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + (expired ? -60 : 1800) }),
  ).toString("base64url") +
  ".signature";
const unauthorized = () => Object.assign(new Error("Unauthorized"), { response: { status: 401 } });
let redirects;
const storage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};
beforeEach(() => {
  setActivePinia(createPinia());
  globalThis.localStorage = storage();
  globalThis.sessionStorage = storage();
  globalThis.useRuntimeConfig = () => ({ public: { baseURL: "http://localhost:3001/api" } });
  globalThis.useNuxtApp = () => ({ runWithContext: (fn) => fn() });
  redirects = [];
  globalThis.navigateTo = async (path) => {
    redirects.push(path);
  };
  globalThis.useAPIFetch = async () => ({
    success: true,
    data: {
      data: { user: { id: "1", name: "Test" }, roles: ["admin"], permissions: ["users.manage"] },
    },
    error: null,
  });
});

test("concurrent expired requests share one refresh and retry with original options", async () => {
  const auth = useAuthStore();
  auth.token = token(true);
  let refreshes = 0;
  globalThis.$fetch = async () => {
    refreshes++;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return { data: { access_token: token(false) } };
  };
  const body = { name: "unchanged" };
  const query = { page: 3 };
  let calls = 0;
  const api = createAuthRequest({
    token: () => auth.token,
    refresh: () => auth.refresh(),
    unauthenticated: async () => assert.fail("unexpected logout"),
    fetch: async (path, options) => {
      calls++;
      assert.equal(path, "/protected");
      assert.equal(options.body, body);
      assert.equal(options.query, query);
      assert.equal(options.method, "POST");
      assert.equal(options.responseType, "blob");
      assert.equal(options.headers.get("X-Custom"), "kept");
      assert.equal(options.credentials, "include");
      if (accessTokenExpired(options.headers.get("Authorization").slice(7))) throw unauthorized();
      return "ok";
    },
  });
  const results = await Promise.all(
    Array.from({ length: 5 }, () =>
      api("/protected", {
        method: "POST",
        body,
        query,
        responseType: "blob",
        headers: { "X-Custom": "kept" },
      }),
    ),
  );
  assert.deepEqual(results, ["ok", "ok", "ok", "ok", "ok"]);
  assert.equal(refreshes, 1);
  assert.equal(calls, 10);
});

test("unexpired token authorization failures and 403s never trigger refresh", async () => {
  let refreshed = 0;
  const api = createAuthRequest({
    token: () => token(false),
    refresh: async () => {
      refreshed++;
    },
    unauthenticated: async () => {},
    fetch: async () => {
      throw unauthorized();
    },
  });
  await assert.rejects(api("/protected"));
  assert.equal(refreshed, 0);
});

test("failed refresh redirects once and never recursively retries refresh", async () => {
  const auth = useAuthStore();
  auth.token = token(true);
  let attempts = 0;
  globalThis.$fetch = async () => {
    attempts++;
    throw unauthorized();
  };
  const api = createAuthRequest({
    token: () => auth.token,
    refresh: () => auth.refresh(),
    unauthenticated: async () => {
      auth.clearSession();
      await navigateTo("/login");
    },
    fetch: async () => {
      throw unauthorized();
    },
  });
  await assert.rejects(api("/protected"));
  assert.equal(attempts, 1);
  assert.equal(auth.token, null);
  assert.deepEqual(redirects, ["/login"]);
});

test("original request is retried at most once after successful refresh", async () => {
  let value = token(true),
    calls = 0,
    refreshes = 0,
    exits = 0;
  const api = createAuthRequest({
    token: () => value,
    refresh: async () => {
      refreshes++;
      value = token(false);
    },
    unauthenticated: async () => {
      exits++;
    },
    fetch: async () => {
      calls++;
      throw unauthorized();
    },
  });
  await assert.rejects(api("/protected"));
  assert.equal(calls, 2);
  assert.equal(refreshes, 1);
  assert.equal(exits, 1);
});

test("reload restores user and permissions via cookie, deleting legacy persistent tokens", async () => {
  localStorage.setItem("auth-store", "legacy-access-token");
  const auth = useAuthStore();
  let attempts = 0;
  globalThis.$fetch = async (path, options) => {
    assert.equal(path, "/auth/refresh");
    assert.equal(options.credentials, "include");
    assert.equal(options.headers["X-Auth-Request"], "1");
    attempts++;
    return { data: { access_token: token(false) } };
  };
  await Promise.all([auth.restore(), auth.restore()]);
  assert.equal(attempts, 1);
  assert.equal(auth.authenticated, true);
  assert.equal(auth.initialized, true);
  assert.equal(auth.user.name, "Test");
  assert.deepEqual(auth.permissions, ["users.manage"]);
  assert.equal(localStorage.getItem("auth-store"), null);
});

test("expired refresh at startup leaves unauthenticated and completes restoration", async () => {
  globalThis.$fetch = async () => {
    throw unauthorized();
  };
  const auth = useAuthStore();
  await auth.restore();
  assert.equal(auth.authenticated, false);
  assert.equal(auth.initialized, true);
  assert.equal(auth.token, null);
});

test("logout clears cached identity even offline and prevents automatic restoration", async () => {
  const auth = useAuthStore();
  auth.token = token(false);
  auth.user = { name: "Test" };
  auth.authenticated = true;
  auth.permissions = ["users.manage"];
  localStorage.setItem("auth-store", "legacy");
  globalThis.$fetch = async () => {
    throw new Error("offline");
  };
  const result = await auth.logout();
  assert.equal(result.success, false);
  assert.equal(auth.token, null);
  assert.equal(auth.user, null);
  assert.deepEqual(auth.permissions, []);
  assert.equal(localStorage.getItem("auth-store"), null);
  assert.equal(sessionStorage.getItem("auth:logged-out"), "1");
  assert.deepEqual(redirects, ["/login"]);
  await assert.rejects(auth.refresh());
});

test("logout does not allow an in-flight refresh to restore authentication", async () => {
  const auth = useAuthStore();
  let release;
  globalThis.$fetch = async (path) => {
    if (path === "/auth/refresh")
      return new Promise((resolve) => {
        release = () => resolve({ data: { access_token: token(false) } });
      });
    assert.equal(path, "/auth/logout");
    return { data: { message: "Logged out" } };
  };
  const pending = auth.refresh().catch(() => {});
  const logout = auth.logout();
  release();
  await Promise.all([pending, logout]);
  assert.equal(auth.token, null);
  assert.equal(auth.authenticated, false);
});

test("403 does not refresh even when the access token is expired", async () => {
  let refreshed = 0;
  const api = createAuthRequest({
    token: () => token(true),
    refresh: async () => {
      refreshed++;
    },
    unauthenticated: async () => assert.fail("unexpected redirect"),
    fetch: async () => {
      throw { response: { status: 403 } };
    },
  });
  await assert.rejects(api("/protected"));
  assert.equal(refreshed, 0);
});

test("a profile response arriving after logout cannot repopulate identity", async () => {
  const auth = useAuthStore();
  let release;
  globalThis.useAPIFetch = async () =>
    new Promise((resolve) => {
      release = () =>
        resolve({
          success: true,
          data: {
            data: { user: { name: "Late user" }, roles: ["admin"], permissions: ["users.manage"] },
          },
        });
    });
  globalThis.$fetch = async () => ({ data: { message: "Logged out" } });
  const pending = auth.me();
  await auth.logout();
  release();
  await pending;
  assert.equal(auth.user, null);
  assert.equal(auth.authenticated, false);
  assert.deepEqual(auth.permissions, []);
});

test("login uses the existing payload/envelope and clears the logout marker", async () => {
  const auth = useAuthStore();
  sessionStorage.setItem("auth:logged-out", "1");
  globalThis.$fetch = async (path, options) => {
    assert.equal(path, "/auth/login");
    assert.deepEqual(options.body, { email: "test@example.com", password: "password" });
    assert.equal(options.credentials, "include");
    return { success: true, data: { access_token: token(false) } };
  };
  const result = await auth.login({ email: "test@example.com", password: "password" });
  assert.equal(result.success, true);
  assert.equal(auth.authenticated, true);
  assert.equal(sessionStorage.getItem("auth:logged-out"), null);
  assert.equal(localStorage.getItem("auth-store"), null);
});

test("a rejected refresh is not repeatedly called by later unauthorized requests", async () => {
  const auth = useAuthStore();
  let attempts = 0;
  globalThis.$fetch = async () => {
    attempts++;
    throw unauthorized();
  };
  await assert.rejects(auth.refresh());
  await assert.rejects(auth.refresh());
  assert.equal(attempts, 1);
});
