import { useAuthStore } from "~/store/auth";

export const usePermissions = () => {
  const store = useAuthStore();

  const can = (permission: string | string[]) => {
    return store.hasPermission(permission);
  };

  return {
    can,
  };
};

