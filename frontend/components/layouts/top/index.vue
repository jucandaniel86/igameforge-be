<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/auth';

const emit = defineEmits<{ 'toggle-menu': [] }>();
const auth = useAuthStore();
const { user } = storeToRefs(auth);
const loggingOut = ref(false);

async function logout() {
  loggingOut.value = true;
  try {
    await auth.logout();
    await navigateTo('/login');
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
    >Logout</v-btn>
  </v-app-bar>
</template>
