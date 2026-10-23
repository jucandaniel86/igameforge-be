<script setup lang="ts">
import { GAMESYNC_BREADCRUMBS } from "~/components/users/Utils";
import { useSelector } from "@/components/selector/useSelector";
import { useAlert } from "@/composables/useAlert";
import { useAuthStore } from "~/store/auth";

const { getEnvironments } = useSelector();

//types
type EnvLastUpdateType = {
  env: string;
  total_inserted: number;
  total_updated: number;
  added_at: string;
};

type LatestUpdatesType = {
  games: EnvLastUpdateType[];
  operators: EnvLastUpdateType[];
};

//models
const environments = ref<string[]>([]);
const currentGamesEnvironments = ref<string>();
const currentOperatorsEnvironments = ref<string>();
const loadLatest = ref<boolean>(false);
const latestUpdates = ref<LatestUpdatesType>({
  games: [],
  operators: [],
});
const gamesSyncLoading = ref<boolean>(false);
const operatorsSyncLoading = ref<boolean>(false);

//composables
const { user } = storeToRefs(useAuthStore());
const { confirmAsync, alertWarning, alertSuccess } = useAlert();

//methods
const getLatestUpdates = async () => {
  loadLatest.value = true;
  const { success, data } = await useAPIFetch("/sync/latest");

  console.log("getLatestUpdates", success, data);
  if (success && data) {
    latestUpdates.value = data.data;
  }

  loadLatest.value = false;
};

const syncGames = async () => {
  if (!currentGamesEnvironments.value) {
    alertWarning("Please select an environment.");
    return;
  }

  await confirmAsync("Are you sure you want to sync games?").then(async (confirmed: boolean) => {
    if (confirmed) {
      gamesSyncLoading.value = true;
      const { success, data } = await useAPIFetch("/sync/games", {
        env: currentGamesEnvironments.value,
      });

      if (success) {
        await getLatestUpdates();
        const executionSeconds =
          typeof data.execution_ms === "number" ? (data.execution_ms / 1000).toFixed(2) : null;
        const message = data.data
          ? `\nInserted: ${data.data.total_inserted}, Updated: ${data.data.total_updated}${
              executionSeconds ? `\nExecution time: ${executionSeconds}s` : ""
            }`
          : "";
        alertSuccess(`Games synced successfully! ${message}`);
      }
      gamesSyncLoading.value = false;
    }
  });
};

const syncOperators = async () => {
  if (!currentOperatorsEnvironments.value) {
    alertWarning("Please select an environment.");
    return;
  }

  await confirmAsync("Are you sure you want to sync operators?").then(
    async (confirmed: boolean) => {
      if (confirmed) {
        operatorsSyncLoading.value = true;
        const { success, data } = await useAPIFetch("/sync/operators", {
          env: currentOperatorsEnvironments.value,
        });

        if (success) {
          await getLatestUpdates();
          const message = data.data
            ? `\nInserted: ${data.data.total_inserted}, Updated: ${data.data.total_updated}`
            : "";
          alertSuccess(`Operators synced successfully! ${message}`);
        }
        operatorsSyncLoading.value = false;
      }
    },
  );
};

//computed
const gamesLastUpdate = computed(() => {
  return latestUpdates.value.games.find(
    (item) =>
      String(item.env).toLowerCase() === String(currentGamesEnvironments.value).toLowerCase(),
  );
});

const operatorsLastUpdate = computed(() => {
  return latestUpdates.value.operators.find(
    (item) =>
      String(item.env).toLowerCase() === String(currentOperatorsEnvironments.value).toLowerCase(),
  );
});

useSeoMeta({
  title: "Settings :: Games Sync",
  ogTitle: "Settings :: Games Sync",
});

onMounted(async () => {
  const { success, data } = await getEnvironments();

  if (success) {
    environments.value = data.data;
    currentGamesEnvironments.value = user.value?.env;
    currentOperatorsEnvironments.value = user.value?.env;
  }
  await getLatestUpdates();
});
</script>
<template>
  <CommonBreadcrumb title="Games/Operators Sync" :items="GAMESYNC_BREADCRUMBS" />

  <v-card>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <v-alert v-if="gamesLastUpdate" type="info" class="mb-4">
            <p class="mb-0"><strong>Games Last Update:</strong> {{ gamesLastUpdate?.added_at }}</p>
            <p class="mb-0">
              <strong>Total Inserted:</strong> {{ gamesLastUpdate?.total_inserted }}
            </p>
            <p class="mb-0"><strong>Total Updated:</strong> {{ gamesLastUpdate?.total_updated }}</p>
          </v-alert>
          <v-select
            v-model="currentGamesEnvironments"
            label="Select Environment"
            dense
            :items="environments"
            :loading="!environments.length"
            :item-title="'label'"
            :item-children="'key'"
          />
          <v-btn
            color="primary"
            class="mt-3"
            :disabled="!environments.length || gamesSyncLoading"
            @click.prevent="syncGames"
          >
            <template v-if="gamesSyncLoading" #prepend>
              <v-icon class="sync-loading-icon" icon="mdi-loading" />
            </template>
            Sync Games
          </v-btn>
        </v-col>
        <v-col cols="12" md="6">
          <v-alert v-if="operatorsLastUpdate" type="info" class="mb-4">
            <p class="mb-0">
              <strong>Operators Last Update:</strong> {{ operatorsLastUpdate?.added_at }}
            </p>
            <p class="mb-0">
              <strong>Total Inserted:</strong> {{ operatorsLastUpdate?.total_inserted }}
            </p>
            <p class="mb-0">
              <strong>Total Updated:</strong> {{ operatorsLastUpdate?.total_updated }}
            </p>
          </v-alert>
          <v-select
            v-model="currentOperatorsEnvironments"
            label="Select Environment"
            dense
            :items="environments"
            :loading="!environments.length"
            :item-title="'label'"
            :item-children="'key'"
          />
          <v-btn
            color="primary"
            class="mt-3"
            :disabled="!environments.length || operatorsSyncLoading"
            @click.prevent="syncOperators"
          >
            <template v-if="operatorsSyncLoading" #prepend>
              <v-icon class="sync-loading-icon" icon="mdi-loading" />
            </template>
            Sync Operators
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
