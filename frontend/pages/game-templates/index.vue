<script setup lang="ts">
import { useApiGameTemplates } from "./apiGameTemplates";
import GameSettings from "./partials/GameSettings.vue";

useSeoMeta({
  title: "Games Templates",
  ogTitle: "Games Templates",
});
definePageMeta({
  middleware: "auth",
});

//models
const games = ref<any[]>([]);
const loading = ref<boolean>(false);
const searchText = ref<string>("");
const tableColumns = ref<any>([]);
const openGameSettings = ref<boolean>(false);
const currentGame = ref<number | string | null>();
const currentGameName = ref<string>("");

const { loadPage } = useApiGameTemplates();

//methods
const handleOpenGameSettings = (game: any) => {
  currentGame.value = game.gameId;
  currentGameName.value = game.title;
  openGameSettings.value = true;
};

const closeGameSettings = () => {
  currentGame.value = null;
  currentGameName.value = "";
  openGameSettings.value = false;
};

//computed
const tableHeaders = computed(() => [
  ...tableColumns.value.map((col: any) => ({
    title: col.fieldLabel,
    key: `values.${col.fieldKey}`,
    sortable: false,
  })),
  { title: "Actions", key: "actions", sortable: false },
]);

const tableItems = computed(() =>
  games.value.map((game: any) => ({
    gameId: game.gameId,
    values: Object.fromEntries(
      game.fields.map((field: any) => [field.fieldKey, field.fieldValue ?? ""]),
    ),
  })),
);

const isEnabled = (value: unknown) => value === true || value === 1 || value === "1";
const wrapLoadingPage = async () => {
  loading.value = true;
  const [loadedTableColumns, loadedGames] = await loadPage();
  tableColumns.value = loadedTableColumns;
  games.value = loadedGames;
  loading.value = false;
};

//mounted
onMounted(async () => await wrapLoadingPage());
</script>
<template>
  <v-data-table
    :headers="tableHeaders as any"
    :items="tableItems"
    item-value="gameId"
    :loading="loading"
    class="pa-2"
    :height="700"
    :hide-default-footer="true"
    :items-per-page="0"
    :search="searchText"
    fixed-header
    filter-mode="some"
  >
    <template v-slot:top>
      <v-row justify="start" class="align-center">
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
      </v-row>
    </template>

    <template
      v-for="col in tableColumns.filter((c: any) => c.fieldType === 'boolean')"
      :key="col.fieldKey"
      v-slot:[`item.values.${col.fieldKey}`]="{ item }"
    >
      <v-icon :color="isEnabled(item.values[col.fieldKey]) ? 'success' : 'grey'">
        {{ isEnabled(item.values[col.fieldKey]) ? "mdi-toggle-switch" : "mdi-toggle-switch-off" }}
      </v-icon>
    </template>

    <template v-slot:item.actions="{ item }">
      <v-btn color="primary" size="small" @click="handleOpenGameSettings(item)">
        <v-icon>mdi-pencil</v-icon>
        Edit Template
      </v-btn>
    </template>

    <template #bottom>
      <div class="pa-4 text-right text-medium-emphasis">
        Total: <strong>{{ games.length }}</strong> games
      </div>
    </template>
  </v-data-table>
  <v-dialog v-model="openGameSettings" :max-width="800" @after-leave="closeGameSettings">
    <GameSettings
      v-if="currentGame"
      :game-id="currentGame"
      @on-modal-close="closeGameSettings"
      @on-list-reload="wrapLoadingPage"
    />
  </v-dialog>
</template>
