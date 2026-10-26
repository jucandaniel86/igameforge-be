import { useAuthStore } from "~/store/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore();
  await auth.restore();
  if (to.name !== "login") {
    if (!auth.authenticated) return navigateTo("/login");
    const result = await auth.me();
    if (!result.success) {
      auth.clearSession();
      return navigateTo("/login");
    }
  } else if (auth.authenticated) {
    return navigateTo("/");
  }
});
