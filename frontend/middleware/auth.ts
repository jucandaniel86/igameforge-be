import { useAuthStore } from "~/store/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  const { authenticated } = storeToRefs(useAuthStore());
  const store = useAuthStore();

  if (to?.name !== "login") {
    const { success } = await store.me();

    if (!success) {
      abortNavigation();
      authenticated.value = false;
      return navigateTo("/login");
    }
  }

  if (!authenticated.value && to?.name !== "login") {
    abortNavigation();

    return navigateTo("/login");
  }

  if (authenticated.value && to?.name === "login") {
    return navigateTo("/");
  }
});
