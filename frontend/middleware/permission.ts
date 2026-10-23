import { useAuthStore } from "~/store/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  const store = useAuthStore();
  const required = (to.meta?.permission || null) as string | string[] | null;

  if (!required) {
    return;
  }

  if (!store.user) {
    const { success } = await store.me();
    if (!success) {
      return navigateTo("/login");
    }
  }

  const permissions = Array.isArray(required) ? required : [required];
  const hasAccess = permissions.some((permission) => store.hasPermission(permission));

  if (!hasAccess) {
    return navigateTo("/");
  }
});

