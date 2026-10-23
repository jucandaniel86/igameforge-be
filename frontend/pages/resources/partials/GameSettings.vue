<script setup lang="ts">
enum ResourceEnum {
  TEXT = "text",
  FILE = "file",
  TEXTAREA = "textarea",
  NUMBER = "number",
  BOOLEAN = "boolean",
  JSON = "json",
  SELECT = "select",
  MULTISELECT = "multiselect",
}

type GameSettingField = {
  id: number;
  field_key: string;
  field_label: string;
  field_type: ResourceEnum;
  field_value: any;
  field_values?: string;
};

//props
const props = defineProps({
  gameId: {
    type: [Number, String],
    required: true,
  },
  gameName: {
    type: String,
    required: true,
  },
});

//models
const loading = ref<boolean>(false);
const saveLoading = ref<boolean>(false);
const language = ref<string>("en");
const loadedLanguage = ref<string>("en");
const fields = ref<GameSettingField[]>([]);
const initialFieldsSnapshot = ref<string>("[]");

//composables
const { alertSuccess, axiosErrorAlert } = useAlert();

//emitters
const emitters = defineEmits(["onModalClose", "onListReload"]);

//computed
const hasUnsavedChanges = computed(() => getFieldsSnapshot() !== initialFieldsSnapshot.value);
const hasLanguageChanged = computed(() => language.value !== loadedLanguage.value);

//methods
const parseSelectField = (val?: string): string[] => {
  if (!val) return [];

  return val.split(",").map((el) => el.trim());
};

const convertGetFields = (field: any, type: ResourceEnum) => {
  try {
    switch (type) {
      case ResourceEnum.MULTISELECT:
        if (!field) return [];

        const content = JSON.parse(field);
        return Array.isArray(content) ? content : [];
      case ResourceEnum.BOOLEAN:
        return field === true || field === "1" || field === 1 || field === "true";
      default:
        return field ?? "";
    }
  } catch (err) {
    return type === ResourceEnum.MULTISELECT ? [] : field;
  }
};

const sanitizeJsonResource = (content: any) => {
  if (content === undefined || content === null) {
    return "";
  }

  if (typeof content === "string") {
    try {
      return JSON.stringify(JSON.parse(content));
    } catch {
      return content.replace(/\s+/g, "").replace(/\\[nr]/g, "");
    }
  }

  return JSON.stringify(content)
    .replace(/\s+/g, "")
    .replace(/\\[nr]/g, "");
};

const convertResource = (content: any, resourceType: ResourceEnum) => {
  switch (resourceType) {
    case ResourceEnum.JSON:
      return sanitizeJsonResource(content);
    case ResourceEnum.MULTISELECT:
      return sanitizeJsonResource(Array.isArray(content) ? content : []);
    case ResourceEnum.BOOLEAN:
      return content ? "1" : "0";
    default:
      return content ?? "";
  }
};

const getFieldsSnapshot = () => {
  return JSON.stringify(
    fields.value.map((field) => ({
      id: field.id,
      field_value: convertResource(field.field_value, field.field_type),
    })),
  );
};

const syncInitialFieldsSnapshot = () => {
  initialFieldsSnapshot.value = getFieldsSnapshot();
};

const loadGameSettings = async (): Promise<void> => {
  loading.value = true;
  const { success, data, error } = await useAPIFetch("/resources/game-resource-types/get", {
    game_id: props.gameId,
    language: language.value,
  });
  if (success) {
    fields.value = (data.fields || []).map((field: GameSettingField) => ({
      ...field,
      field_value: convertGetFields(field.field_value, field.field_type),
    }));
    loadedLanguage.value = language.value;
    syncInitialFieldsSnapshot();
  }

  if (!success && error) {
    axiosErrorAlert(error);
  }
  loading.value = false;
};

const save = async (): Promise<void> => {
  saveLoading.value = true;
  const { success, data, error } = await useApiPostFetch("/resources/game-settings/save", {
    game_id: props.gameId,
    language: language.value,
    fields: fields.value.map((field) => ({
      game_resources_field_id: field.id,
      field_value: convertResource(field.field_value, field.field_type),
    })),
  });
  saveLoading.value = false;

  if (success) {
    syncInitialFieldsSnapshot();
    emitters("onListReload");
    return alertSuccess(data.message);
  }

  if (!success && error) {
    axiosErrorAlert(error);
  }
};

const onMultiselectUpdated = (field: GameSettingField, val: any) => {
  field.field_value = Array.isArray(val) ? val.filter((v) => v !== "") : val;
};

onMounted(() => {
  loadGameSettings();
});
</script>
<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex justify-start align-center ga-1">
        <v-icon icon="mdi-cog-outline" />
        <h3 class="text-h6">GAME TEMPLATES :: {{ gameName }} ({{ gameId }})</h3>
      </div>
      <v-btn color="primary" size="small" @click.prevent="emitters('onModalClose')">
        <v-icon>mdi-close</v-icon>
        Close
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-progress-linear indeterminate v-if="loading" />
      <v-alert v-if="!loading && fields.length === 0" type="info" variant="tonal">
        No game resource types configured.
      </v-alert>
      <v-row class="mb-4" align="center">
        <v-col cols="12" md="6">
          <v-text-field
            v-model="language"
            hide-details
            variant="outlined"
            density="compact"
            class="filter-search text-field-component"
            label="Language"
          />
        </v-col>
        <v-col v-if="hasLanguageChanged" cols="12" md="6">
          <v-btn
            prepend-icon="mdi-file-download-outline"
            text="Load template"
            color="primary"
            variant="flat"
            :loading="loading"
            :disabled="loading || saveLoading || !language"
            @click.prevent="loadGameSettings"
          />
        </v-col>
      </v-row>
      <v-row v-if="!loading">
        <v-col v-for="field in fields" :key="field.id" cols="12" md="6">
          <v-textarea
            v-if="[ResourceEnum.TEXTAREA, ResourceEnum.JSON].indexOf(field.field_type) !== -1"
            v-model="field.field_value"
            :rows="field.field_type === ResourceEnum.JSON ? 8 : 3"
            hide-details
            variant="outlined"
            density="compact"
            class="filter-search text-field-component"
            :label="field.field_label"
          />
          <v-checkbox
            v-else-if="field.field_type === ResourceEnum.BOOLEAN"
            v-model="field.field_value"
            hide-details
            density="compact"
            :label="field.field_label"
          />
          <v-file-input
            v-else-if="field.field_type === ResourceEnum.FILE"
            v-model="field.field_value"
            hide-details
            variant="outlined"
            density="compact"
            class="filter-search text-field-component"
            :label="field.field_label"
          />
          <v-select
            v-else-if="field.field_type === ResourceEnum.SELECT"
            v-model="field.field_value"
            :items="parseSelectField(field.field_values)"
            hide-details
            variant="solo"
            density="compact"
            class="filter-search text-field-component"
            :label="field.field_label"
          />
          <v-select
            v-else-if="field.field_type === ResourceEnum.MULTISELECT"
            v-model="field.field_value"
            :items="parseSelectField(field.field_values)"
            hide-details
            variant="solo"
            density="compact"
            class="filter-search text-field-component"
            multiple
            :label="field.field_label"
            @update:modelValue="(val) => onMultiselectUpdated(field, val)"
          />
          <v-text-field
            v-else
            v-model="field.field_value"
            :type="field.field_type === ResourceEnum.NUMBER ? 'number' : 'text'"
            hide-details
            variant="outlined"
            density="compact"
            class="filter-search text-field-component"
            :label="field.field_label"
          />
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions class="d-flex justify-center w-100">
      <v-btn
        prepend-icon="mdi-content-save"
        text="SAVE"
        color="blue"
        variant="flat"
        :loading="saveLoading"
        :disabled="loading || saveLoading || hasLanguageChanged || !hasUnsavedChanges"
        @click.prevent="save"
      />
    </v-card-actions>
  </v-card>
</template>
