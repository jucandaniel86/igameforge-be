import { defineStore } from "pinia";
import { withAuthCookieLock } from "~/utils/auth-request";

let refreshOperation: Promise<void> | null = null;
let restoreOperation: Promise<void> | null = null;

export enum EnvEnum {
  dev = "dev",
  uat = "uat",
  prod = "prod",
  prng = "prng",
}

export enum UserTypeEnum {
  ADMIN = "admin",
  OPERATOR = "operator",
}

type UserType = {
  id: number;
  name: string;
  email: string;
  env: EnvEnum;
  user_type: UserTypeEnum;
  site_id: string;
  allowedEnvs?: EnvEnum[];
};

interface AuthStoreInterface {
  authenticated: boolean;
  user: UserType | null;
  token: string | null;
  roles: string[];
  permissions: string[];
  initialized: boolean;
  sessionVersion: number;
  refreshFailed: boolean;
}

interface LoginPayload {
  email: string;
  password: string;
}

export const useAuthStore = defineStore("auth-store", {
  state: (): AuthStoreInterface => ({
    authenticated: false,
    user: null,
    token: "",
    roles: [],
    permissions: [],
    initialized: false,
    sessionVersion: 0,
    refreshFailed: false,
  }),
  actions: {
    clearSession() {
      this.sessionVersion++;
      this.authenticated = false;
      this.token = null;
      this.user = null;
      this.roles = [];
      this.permissions = [];
      // Remove the legacy persisted Pinia store, including old access tokens.
      if (import.meta.client) localStorage.removeItem("auth-store");
    },
    async login(payload: LoginPayload): Promise<useApiFetchType> {
      const config = useRuntimeConfig();
      this.clearSession();
      this.refreshFailed = false;
      try {
        const data: any = await withAuthCookieLock(() =>
          $fetch("/auth/login", {
            baseURL: config.public.baseURL,
            method: "POST",
            body: payload,
            credentials: "include",
            headers: { "X-Auth-Request": "1" },
            retry: 0,
            timeout: 15000,
          }),
        );
        this.token = data.data.access_token;
        this.authenticated = true;
        this.initialized = true;
        sessionStorage.removeItem("auth:logged-out");
        return { success: true, data, error: null };
      } catch (error: any) {
        return { success: false, data: null, error, message: error?.data?.message };
      }
    },
    async refresh(): Promise<void> {
      if (sessionStorage.getItem("auth:logged-out") || this.refreshFailed) {
        throw new Error("Session unavailable");
      }
      if (!refreshOperation) {
        const config = useRuntimeConfig();
        const version = this.sessionVersion;
        refreshOperation = withAuthCookieLock(async () => {
          if (version !== this.sessionVersion) throw new Error("Session changed");
          const data: any = await $fetch("/auth/refresh", {
            baseURL: config.public.baseURL,
            method: "POST",
            credentials: "include",
            headers: { "X-Auth-Request": "1" },
            retry: 0,
            timeout: 15000,
          });
          if (version !== this.sessionVersion) throw new Error("Session changed");
          this.token = data.data.access_token;
          this.authenticated = true;
        })
          .catch((error) => {
            if (version === this.sessionVersion) {
              this.clearSession();
              this.refreshFailed = true;
            }
            throw error;
          })
          .finally(() => {
            refreshOperation = null;
          });
      }
      return refreshOperation;
    },
    async restore(): Promise<void> {
      if (this.initialized) return;
      const nuxtApp = useNuxtApp();
      if (!restoreOperation) {
        restoreOperation = (async () => {
          this.clearSession();
          try {
            await this.refresh();
            const result = await nuxtApp.runWithContext(() => this.me());
            if (!result.success) this.clearSession();
          } catch {
            this.clearSession();
          } finally {
            this.initialized = true;
          }
        })().finally(() => {
          restoreOperation = null;
        });
      }
      return restoreOperation;
    },
    async logout() {
      const nuxtApp = useNuxtApp();
      // Block late refresh responses immediately, then revoke the latest cookie.
      this.clearSession();
      this.initialized = true;
      sessionStorage.setItem("auth:logged-out", "1");
      let failure: unknown = null;
      const config = useRuntimeConfig();
      try {
        await refreshOperation?.catch(() => {});
        await withAuthCookieLock(() =>
          $fetch("/auth/logout", {
            baseURL: config.public.baseURL,
            method: "POST",
            credentials: "include",
            headers: { "X-Auth-Request": "1" },
            retry: 0,
            timeout: 15000,
          }),
        );
      } catch (error) {
        failure = error;
      } finally {
        this.clearSession();
        await nuxtApp.runWithContext(() => navigateTo("/login"));
      }
      return { success: !failure, error: failure };
    },
    async me(): Promise<useApiFetchType> {
      const version = this.sessionVersion;
      const { data, success, error }: any = await useAPIFetch("/auth/me", {});

      if (success && data?.data && version === this.sessionVersion) {
        this.authenticated = true;
        this.user = data.data.user ?? data.data;
        this.roles = Array.isArray(data.data.roles) ? data.data.roles : [];
        this.permissions = Array.isArray(data.data.permissions) ? data.data.permissions : [];
      }

      return {
        data,
        success,
        error,
      };
    },
    hasPermission(permission: string | string[]): boolean {
      const required = Array.isArray(permission) ? permission : [permission];
      return required.some((item) => this.permissions.indexOf(item) !== -1);
    },
    hasRole(role: string | string[]): boolean {
      const required = Array.isArray(role) ? role : [role];
      return required.some((item) => this.roles.indexOf(item) !== -1);
    },
  },
});
