import { defineStore } from "pinia"; 

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
  }),
  actions: {
    async login(_payload: LoginPayload): Promise<useApiFetchType> {
      const { data, success, error, message }: any = await useApiPostFetch("/auth/login", _payload);
	 
      if (success) {
        this.authenticated = true;
        this.token = data.data.access_token;  
      }
      return {
        data,
        success,
        error,
				message
      };
    },
    async logout() {
      await useApiPostFetch("/logout", {}, true);
      this.authenticated = false;
      this.token = null;
      this.user = null;
      this.roles = [];
      this.permissions = [];
    },
    async me(): Promise<useApiFetchType> {
      const { data, success, error }: any = await useAPIFetch("/auth/me", {});

      if (data) {
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
  persist: {
    storage: persistedState.localStorage,
  },
});

 
