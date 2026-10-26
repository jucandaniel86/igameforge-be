<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "~/store/auth";

const emit = defineEmits<{ "toggle-menu": [] }>();
const auth = useAuthStore();
const nuxtApp = useNuxtApp();
const { user } = storeToRefs(auth);
const loggingOut = ref(false);
const { alertWarning } = useAlert();

async function logout() {
  loggingOut.value = true;
  try {
    const result = await nuxtApp.runWithContext(() => auth.logout());
    if (!result.success)
      alertWarning(
        "You are signed out locally. The server session could not be revoked; retry when connected.",
      );
  } finally {
    loggingOut.value = false;
  }
}
</script>

<template>
  <v-app-bar height="70" elevation="1" class="app-topbar px-3">
    <v-btn
      class="d-lg-none"
      icon="mdi-menu"
      variant="text"
      aria-label="Open navigation menu"
      @click="emit('toggle-menu')"
    />
    <v-spacer />
    <span class="text-truncate mr-3">{{ user?.name || user?.email }}</span>
    <v-btn
      prepend-icon="mdi-logout"
      variant="text"
      :loading="loggingOut"
      :disabled="loggingOut"
      @click="logout"
      >Logout</v-btn
    >
  </v-app-bar>
</template>
