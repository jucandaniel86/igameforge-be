<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "~/store/auth";

const router = useRouter();
const store = useAuthStore();

const loading = ref(false);
const isSubmitted = ref(false);
const errorMsg = ref("");
const formData = ref({
  email: "",
  password: "",
});

const onSignIn = async () => { 
  loading.value = true;
  const { success, error, message } = await store.login(formData.value);
  loading.value = false;
 
  if (!success) {
	  errorMsg.value = message ? handleErrorMessage(message) :  error.data.error;
  } else {
    const { data } = await store.me();

    setTimeout(() => {
      //@ts-ignore
      useNuxtApp().$toast.success(`Welcome ${data.user.name}`);
    }, 1000);

    router.push("/");
  }
};

const handleErrorMessage = (message: string | string[]) => Array.isArray(message) ? message.join("\n") : message; 

definePageMeta({
  layout: "auth",
  middleware: "auth",
});

useSeoMeta({
  title: "Authentification",
});
</script>
<template>
  <div class="h-100 d-flex align-center justify-center">
    <div class="w-100">
      <v-card-title class="text-center">
        <h5 class="text-h6 font-weight-bold mt-3">Welcome Back</h5>
      </v-card-title>
      <v-card-text class="mt-5 mb-5">
        <v-row justify="center" class="align-center">
          <v-col cols="12">
            <v-alert
              v-if="errorMsg"
              class="mb-3"
              color="danger"
              variant="tonal"
              density="compact"
            >
              {{ errorMsg }}
            </v-alert>
            <div class="font-weight-medium mb-1">
              Username <i class="mdi mdi-asterisk icon-xs text-danger" />
            </div>
            <v-text-field
              v-model="formData.email"
              :value="formData.email"
              isRequired
              :showError="isSubmitted"
              :isSubmitted="isSubmitted"
              hideDetails
              placeholder="Enter username"
            />
            <div class="d-flex justify-space-between align-center mt-4">
              <div class="font-weight-medium">
                Password <i class="mdi mdi-asterisk icon-xs text-danger" />
              </div>
            </div>
            <v-text-field
              v-model="formData.password"
              :value="formData.password"
              type="password"
              placeholder="Enter password"
              hide-details
              :showError="isSubmitted"
              :isSubmitted="isSubmitted"
              isRequired
              isPassword
            />
            <v-btn
              color="primary"
              block
              class="mt-2"
              :loading="loading"
              @click="onSignIn"
            >
              Login In
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </div>
  </div>
</template>
