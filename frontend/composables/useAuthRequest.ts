import { useAuthStore } from "~/store/auth";
import { createAuthRequest } from "~/utils/auth-request";

export const useAuthRequest = () => {
  const auth = useAuthStore();
  const nuxtApp = useNuxtApp();
  return createAuthRequest({
    fetch: (path, options) => $fetch(path, options),
    token: () => auth.token,
    refresh: () => nuxtApp.runWithContext(() => auth.refresh()),
    unauthenticated: async () => {
      auth.clearSession();
      auth.refreshFailed = true;
      await nuxtApp.runWithContext(() => navigateTo("/login"));
    },
  });
};
