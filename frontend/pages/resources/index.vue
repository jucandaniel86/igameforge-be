<script setup lang="ts">
import { useAuthStore } from "~/store/auth";
import { RESOURCE_HEADERS, RESOURCE_OPERATOR_HEADERS } from "./headers";
import OperatorFieldsModal from "./partials/OperatorFieldsModal.vue";
import SaveResource from "./partials/SaveResource.vue";
import CopyGameResource from "./partials/CopyGameResource.vue";
import GameSettings from "./partials/GameSettings.vue";
import GamesToOperator from "./partials/GamesToOperator.vue";
import CopyEnvironment from "./partials/CopyEnvironment.vue";

useSeoMeta({
  title: "Games Resources",
  ogTitle: "Games Resources",
});
definePageMeta({
  middleware: "auth",
});

//models
const games = ref<any[]>([]);
const loading = ref<boolean>(false);
const totalItems = ref<number>(0);
const searchText = ref<string>("");
const noResources = ref<number>(0);
const displayForm = ref<boolean>(false);
const selectedGame = ref<number | string>(0);
const openModalFields = ref<boolean>(false);
const openCopyResource = ref<boolean>(false);
const openCopyDefaultsToOperator = ref<boolean>(false);
const openGameSettings = ref<boolean>(false);
const currentGame = ref<number | string | null>();
const currentGameName = ref<string>("");
const gameResourceTypes = ref<any[]>([]);
const dialog = ref<boolean>(false);
const removeOperatorDialog = ref<boolean>(false);
const operator = ref<string>("");
const copyDefaultsOperatorIds = ref<Array<number | string>>([]);
const copyDefaultsLoading = ref<boolean>(false);
const openCopyEnvironment = ref<boolean>(false);
const gameOperatorDelete = ref<any>();
const loadingGames = ref(false);

//composables
const { removeDuplicates } = useUtils();
const { alertSuccess, alertError, axiosErrorAlert } = useAlert();
const { hasPermission, user } = useAuthStore();

type CopyGameResourcesPayload = {
  operatorID: number | string;
  gameID: number | string;
  gameIds: number[];
};

//methods
const getGames = async (): Promise<void> => {
	loadingGames.value = true;
  const { data } = await useAPIFetch("/resources/games");
  if (data.success) {
    games.value = data.data;
    totalItems.value = games.value.length;
  }
	loadingGames.value = false
};

const getGameResourceTypes = async (): Promise<void> => {
  const { success, data, error } = await useAPIFetch("/resources/game-resource-types/list");

  if (success) {
    gameResourceTypes.value = data.fields || [];
  }

  if (!success && error) {
    axiosErrorAlert(error);
  }
};

const add = () => {
  openModalFields.value = true;
};

const addFields = (gameID: number | string) => {
  displayForm.value = true;
  selectedGame.value = gameID;
  dialog.value = true;
};

//computed
const formatOperators = (operators: string) => {
  if (!operators) return [];

  return Array.isArray(operators) ? operators : operators.split(',')
};

const handleOpenCopyResource = (gameID: string | number) => {
  currentGame.value = gameID;
  openCopyResource.value = true;
};

const handleOpenGameSettings = (game: any) => {
  currentGame.value = game.id;
  currentGameName.value = game.label;
  openGameSettings.value = true;
};

const handleOpenCopyDefaultsToOperator = (game: any) => {
  currentGame.value = game.id;
  currentGameName.value = game.label;
  copyDefaultsOperatorIds.value = [];
  openCopyDefaultsToOperator.value = true;
};

const cancelOepnCopyResource = () => {
  currentGame.value = null;
  openCopyResource.value = false;
};

const closeCopyDefaultsToOperator = () => {
  currentGame.value = null;
  currentGameName.value = "";
  copyDefaultsOperatorIds.value = [];
  openCopyDefaultsToOperator.value = false;
};

const closeGameSettings = () => {
  currentGame.value = null;
  currentGameName.value = "";
  openGameSettings.value = false;
};

const displayedGames = computed(() => {
  return games.value.filter((game) => {
    if (noResources.value) {
      return (game.operators || []).length === 0;
    }
    if (operator.value && !noResources.value) {
      return (game.operators || []).indexOf(operator.value) !== -1;
    }
    return games;
  });
});

const tableHeaders = computed(() => {
  return operator.value ? RESOURCE_OPERATOR_HEADERS : RESOURCE_HEADERS;
});

const onModalClose = () => {
  selectedGame.value = 0;
  dialog.value = false;
};

const openDeleteOperatorModal = (options: any) => {
  gameOperatorDelete.value = options;
  removeOperatorDialog.value = true;
};

const onDeleteOperatorClosed = () => {
  removeOperatorDialog.value = false;
  gameOperatorDelete.value = null;
};

const deleteOperator = async (operator: string, gameID: number) => {
  const { data, success, error } = await useAPIFetch("/resources/delete-operator", {
    gameID,
    operator,
  });
  if (success) {
    await getGames();

    const operators = formatOperators(gameOperatorDelete.value.operators);
    gameOperatorDelete.value.operators = operators
      .filter((_operator) => operator !== _operator)
      .join(",");

    if (!gameOperatorDelete.value.operators) {
      removeOperatorDialog.value = false;
    }

    return alertSuccess(data.message);
  }

  if (!success && error) {
    axiosErrorAlert(error);
  }
};

const copyGameResources = async ({ operatorID, gameID, gameIds }: CopyGameResourcesPayload) => {
  const { data, success, error } = await useApiPostFetch("/resources/copy-game-resources", {
    operatorID,
    gameID,
    game_ids: gameIds,
  });

  if (success) {
    if (!data.success) {
      return alertError(data.message);
    }

    alertSuccess(data.message);
    cancelOepnCopyResource();
    await getGames();
  }

  if (!success && error) {
    axiosErrorAlert(error);
  }
};

const copyDefaultResourcesToOperators = async (): Promise<void> => {
  if (!currentGame.value || copyDefaultsOperatorIds.value.length === 0) return;

  copyDefaultsLoading.value = true;
  const { data, success, error } = await useApiPostFetch("/resources/copy-defaults-to-operators", {
    gameID: currentGame.value,
    operator_ids: copyDefaultsOperatorIds.value,
  });
  copyDefaultsLoading.value = false;

  if (success) {
    if (!data.success) {
      return alertError(data.message);
    }

    alertSuccess(data.message);
    closeCopyDefaultsToOperator();
    await getGames();
  }

  if (!success && error) {
    axiosErrorAlert(error);
  }
};

//mounted
onMounted(() => {
  getGames();
  getGameResourceTypes();
});
</script>
<template>
  <v-dialog v-model="dialog" name="fade" @after-leave="dialog = false">
    <SaveResource
      :gameId="selectedGame"
      v-if="selectedGame"
      :key="selectedGame"
      :selected-operator-id="operator"
      @on-modal-close="onModalClose"
      @on-operator-setup="add"
      @on-save="getGames"
    />
  </v-dialog>
  <v-dialog
    v-model="removeOperatorDialog"
    name="fade"
    max-width="400"
    @after-leave="onDeleteOperatorClosed"
  >
    <v-card>
      <v-card-title>{{ `Delete operators for game ${gameOperatorDelete.label}` }} </v-card-title>
      <v-card-text>
        <v-table>
          <tbody>
            <tr v-for="(operator, index) in formatOperators(gameOperatorDelete.operators)">
              <td>{{ operator }}</td>
              <td align="right">
                <v-btn
                  size="small"
                  color="red"
                  @click.prevent="deleteOperator(operator, gameOperatorDelete.id)"
                >
                  <v-icon icon="mdi-delete" />
                  Delete Operator
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-dialog>
  <v-data-table
    :headers="tableHeaders as any"
    :items="displayedGames"
    :loading="loadingGames"
    class="pa-2"
    :height="700"
    :hide-default-footer="true"
    :items-per-page="0"
    :search="searchText"
    fixed-header
    filter-mode="some"
    :item-value="'id'"
  >
    <template v-slot:top>
      <v-row justify="start" class="align-center">
        <v-col cols="12" md="3">
          <SelectorOperators v-model="operator" :disabled="noResources" />
        </v-col>
        <v-col cols="12" md="2">
          <v-checkbox
            v-model="noResources"
            :false-value="0"
            :true-value="1"
            hide-details
            density="compact"
            variant="outlined"
            label="No resources"
          />
        </v-col>
        <v-col cols="12" md="3" lg="3">
          <v-text-field
            v-model="searchText"
            label="Search"
            hide-details
            variant="outlined"
            density="compact"
            class="filter-search text-field-component"
          ></v-text-field>
        </v-col>
        <v-col cols="auto" class="ml-auto">
          <div class="d-flex ga-1 w-100 justify-space-between align-center">
            <v-btn color="secondary" @click="add">
              <i class="mdi mdi-plus-circle-outline" /> Edit Operator Fields
            </v-btn>
            <v-menu location="bottom end" class="ml-auto">
              <template v-slot:activator="{ props }">
                <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" size="small" />
              </template>

              <v-list density="compact">
                <v-list-item prepend-icon="mdi-file-edit-outline">
                  <GamesToOperator :gamesLoaded="!!games.length" @onListReload="getGames" />
                </v-list-item>
                <v-list-item prepend-icon="mdi-file-edit-outline">
                  <v-btn color="primary" @click.prevent="openCopyEnvironment = true">
                    Copy Resources to Environment
                  </v-btn>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </v-col>
      </v-row>
    </template>
		
    <template v-slot:item.resources="{ item, index }">
      <span v-if="item.operators">
        <v-chip v-for="operator in formatOperators(item.operators)" :text="operator" />
      </span>
      <span v-else>-</span>
    </template>
    <template v-slot:item.label="{ item, index }">
      <div class="d-flex flex-column flex-start align-start ga-0">
        <span>{{ item.title }}</span>
        <v-btn
          variant="text"
          color="primary"
          size="small"
          class="pl-0"
          @click="handleOpenGameSettings(item)"
        >
          <i class="mdi mdi-plus-circle-outline" /> Edit Game Template
        </v-btn>
      </div>
    </template>
    <template v-slot:item.has_game_resource_values="{ item }">
      <v-icon v-if="item.has_game_resource_values" color="success" icon="mdi-check" />
      <v-icon v-else color="error" icon="mdi-close" />
    </template>

    <template v-slot:item.actions="{ item }">
      <v-menu location="bottom end">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" size="small" />
        </template>

        <v-list density="compact">
          <v-list-item
            prepend-icon="mdi-file-edit-outline"
            title="Edit Fields"
            @click="addFields(item.gameId)"
          />
          <v-list-item
            prepend-icon="mdi-content-copy"
            title="Copy Game Resource"
            @click="handleOpenCopyResource(item.id)"
          />
          <v-list-item
            prepend-icon="mdi-account-arrow-right-outline"
            title="Copy to operator"
            :disabled="!item.has_game_resource_values"
            @click="handleOpenCopyDefaultsToOperator(item)"
          />
          <v-list-item
            prepend-icon="mdi-delete"
            title="Delete Operators"
            :disabled="formatOperators(item.operators).length === 0"
            @click="openDeleteOperatorModal(item)"
          />
        </v-list>
      </v-menu>
    </template>
		<template #bottom>
			<div class="pa-4 text-right text-medium-emphasis">
				Total: <span>{{ displayedGames.length }}</span> /<strong>{{ games.length }}</strong> games
			</div>
		</template>
  </v-data-table>
  <v-dialog v-model="openModalFields" :max-width="900">
    <OperatorFieldsModal
      :game-resource-types="gameResourceTypes"
      @on-modal-close="openModalFields = false"
    />
  </v-dialog>
  <v-dialog v-model="openCopyResource" :max-width="600" @after-leave="cancelOepnCopyResource">
    <CopyGameResource
      v-if="currentGame"
      :gameID="currentGame"
      @onCopyGameResources="copyGameResources"
      @onCopyResourcesClosed="cancelOepnCopyResource"
    />
  </v-dialog>
  <v-dialog
    v-model="openCopyDefaultsToOperator"
    :max-width="500"
    @after-leave="closeCopyDefaultsToOperator"
  >
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <h3 class="text-h6">Copy to operator {{ currentGameName }}</h3>
        <v-btn
          color="primary"
          size="small"
          :disabled="copyDefaultsLoading"
          @click.prevent="closeCopyDefaultsToOperator"
        >
          <v-icon>mdi-close</v-icon>
          Close
        </v-btn>
      </v-card-title>
      <v-card-text>
        <SelectorOperators
          :default-value="copyDefaultsOperatorIds"
          :multiple="true"
          @input="(value: Array<number | string>) => (copyDefaultsOperatorIds = value)"
        />
      </v-card-text>
      <v-card-actions class="d-flex justify-end">
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-play"
          text="Run"
          :loading="copyDefaultsLoading"
          :disabled="copyDefaultsLoading || copyDefaultsOperatorIds.length === 0"
          @click.prevent="copyDefaultResourcesToOperators"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="openGameSettings" :max-width="800" @after-leave="closeGameSettings">
    <GameSettings
      v-if="currentGame"
      :game-id="currentGame"
      :game-name="currentGameName"
      @on-modal-close="closeGameSettings"
      @on-list-reload="getGames"
    />
  </v-dialog>
  <v-dialog v-model="openCopyEnvironment" :max-width="600">
    <CopyEnvironment @close="openCopyEnvironment = false" @copied="getGames" />
  </v-dialog>
</template>
