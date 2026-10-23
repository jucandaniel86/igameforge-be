<script setup lang="ts">
import { useAuthStore } from "@/store/auth";

//composables
const { user } = useAuthStore();

//models
const operatorID = ref<number | string>("");
const toEnvironmentID = ref<number | string>("");
const fromEnvironmentID = ref<number | string>("");
const overwriteDuplicates = ref<number>(0);
const loading = ref<boolean>(false);
const { alertSuccess, alertError, axiosErrorAlert } = useAlert();

//computed
const availableEnvironments = computed(() => {
  return user?.allowed_envs?.length ? user.allowed_envs : [user?.env].filter(Boolean);
});

//emits
const emits = defineEmits<{
  (e: "close"): void;
  (e: "copied"): void;
}>();

//methods
const copyEnvironmentResources = async (): Promise<void> => {
  if (!operatorID.value || !fromEnvironmentID.value || !toEnvironmentID.value || loading.value) {
    return;
  }

  loading.value = true;

  const { success, data, error } = await useApiPostFetch("/resources/copy-environment", {
    operatorID: operatorID.value,
    fromEnvironmentID: fromEnvironmentID.value,
    toEnvironment: toEnvironmentID.value,
    overwriteDuplicates: overwriteDuplicates.value,
  });

  loading.value = false;

  if (success) {
    if (!data.success) {
      return alertError(data.message);
    }

    alertSuccess(data.message);
    emits("copied");
    emits("close");
  }

  if (!success && error) {
    axiosErrorAlert(error);
  }
};

//mounted
onMounted(() => {
  if (user && user.env) {
    fromEnvironmentID.value = user.env;
  }
});
</script>
<template>
  <v-card max-width="400">
    <v-card-title>
      <div class="d-flex justify-space-between">
        <h3 class="text-h6">Copy Operator to Environment</h3>
      </div>
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12">
          <SelectorOperators v-model="operatorID" class="mb-2" />
        </v-col>
        <v-col cols="12">
          <v-select
            label="From Environment"
            v-model="fromEnvironmentID"
            :items="availableEnvironments"
            hide-details
            variant="solo"
            density="compact"
          />
        </v-col>
        <v-col cols="12">
          <v-select
            label="To Environment"
            v-model="toEnvironmentID"
            :items="availableEnvironments"
            hide-details
            variant="solo"
            density="compact"
          />
        </v-col>
        <v-col cols="12">
          <v-checkbox
            v-model="overwriteDuplicates"
            label="Overwrite Duplicates"
            :true-value="1"
            :false-value="0"
            hide-details
          />
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions class="d-flex justify-space-between">
      <v-btn
        color="primary"
        flat
        :loading="loading"
        :disabled="loading || !operatorID || !fromEnvironmentID || !toEnvironmentID"
        @click="copyEnvironmentResources"
      >
        Copy Games Resources
      </v-btn>
      <v-btn color="grey" :disabled="loading" @click="emits('close')" :prepend-icon="'mdi-close'">
        Close
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
