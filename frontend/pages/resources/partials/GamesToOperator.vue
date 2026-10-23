<script setup lang="ts">
import { useAuthStore } from "~/store/auth";

type ImportResult = {
  success: boolean;
  message: string;
  imported_games: string[];
  skipped_games: string[];
  failed_games: string[];
  inserted_fields: number;
};

//props
const props = defineProps({
  gamesLoaded: {
    type: Boolean,
    required: true,
  },
});

//emitters
const emitters = defineEmits(["onListReload"]);

//models
const menu = ref(false);
const gamesToImport = ref("");
const operatorID = ref<number | string>("");
const loading = ref(false);
const importResult = ref<ImportResult | null>(null);
const { user } = storeToRefs(useAuthStore());
const { alertSuccess, alertError, axiosErrorAlert } = useAlert();

const hasGamesToImport = computed(() => gamesToImport.value.trim() !== "");

const runImport = async (): Promise<void> => {
  if (!operatorID.value || !hasGamesToImport.value || loading.value) return;

  loading.value = true;
  importResult.value = null;

  const { success, data, error } = await useApiPostFetch("/resources/import-games-to-operator", {
    operatorID: operatorID.value,
    games: gamesToImport.value,
    env: user.value?.env || "",
  });

  loading.value = false;

  if (success) {
    importResult.value = data;

    if (!data.success) {
      return alertError(data.message);
    }

    emitters("onListReload");
    return alertSuccess(data.message);
  }

  if (!success && error) {
    axiosErrorAlert(error);
  }
};
</script>
<template>
  <div class="d-flex">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      location="bottom end"
      transition="scale-transition"
    >
      <template v-slot:activator="{ props }">
        <v-btn :disabled="!gamesLoaded" color="blue" v-bind="props" prepend-icon="mdi-import">
          Import Games
        </v-btn>
      </template>

      <v-card class="games-import-menu" elevation="8">
        <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
          <span class="text-subtitle-1 font-weight-medium">Import games to operator</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            density="comfortable"
            size="small"
            @click="menu = false"
          />
        </v-card-title>

        <v-card-text class="pa-4 pt-2">
          <div class="d-flex flex-column ga-4">
            <SelectorOperators v-model="operatorID" :disabled="!gamesLoaded" />

            <v-textarea
              v-model="gamesToImport"
              label="Game IDs"
              rows="5"
              hide-details
              variant="outlined"
              density="compact"
              placeholder="1001, 1002, 1003"
            />

            <v-alert
              v-if="importResult"
              :type="importResult.success ? 'success' : 'error'"
              variant="tonal"
              density="compact"
            >
              {{ importResult.message }}
            </v-alert>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="justify-end pa-4">
          <v-btn variant="text" @click="menu = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!operatorID || !gamesLoaded || !hasGamesToImport"
            :loading="loading"
            @click="runImport"
          >
            Run
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>
