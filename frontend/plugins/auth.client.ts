import { useAuthStore } from "~/store/auth";

export default defineNuxtPlugin({
  name: "auth-session",
  dependsOn: ["pinia"],
  async setup() {
    await useAuthStore().restore();
  },
});
