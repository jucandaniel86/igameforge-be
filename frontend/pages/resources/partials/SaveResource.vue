<script setup lang="ts">
import { useScroll } from "@vueuse/core";
import { useAuthStore } from "@/store/auth";

//types
type SaveResourceT = {
  gameId: number | string;
  selectedOperatorId?: number | string;
};
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
type ResourceType = {
  id?: number;
  resourceType: ResourceEnum | null;
  resourceContent: any | any[];
  resourceLabel: string;
  gameID: string | number;
  operatorID: any;
  language: any;
  field_id?: any;
  field_values: string;
  source?: "manual" | "generic" | "empty";
  isDefault?: boolean;
};

//props
const props = defineProps<SaveResourceT>();

//models
const resources = ref<ResourceType[]>([]);
const itemsList = ref<HTMLDivElement>();
const operatorID = ref<string | number | null>();
const language = ref<string | null>("en");
const languageOptions = ref<string[]>(["en"]);
const languagesLoading = ref<boolean>(false);
const resourceType = ref<any>();
const fieldsLoading = ref<boolean>(false);
const hasOperatorSetup = ref<boolean>(false);
const initialResourcesSnapshot = ref<string>("[]");
const deactivated = ref<boolean>(false);
const savingActive = ref<boolean>(false);

//composables
const { y } = useScroll(itemsList, { behavior: "smooth" });
const { axiosErrorAlert, alertSuccess, confirm } = useAlert();
const authStore = useAuthStore();

//computed
const canAdd = computed(() => operatorID.value && language.value && resourceType.value);

//emitters
const emitters = defineEmits(["onModalClose", "onOperatorSetup", "onSave"]);

//methods
const add = () => {
  if (!canAdd.value) return;

  const eq = resources.value.some((resource) => {
    return (
      resource.resourceLabel === resourceType.value.field_label &&
      resource.language === language.value &&
      resource.operatorID === operatorID.value
    );
  });

  if (eq) return;

  resources.value.push({
    resourceType: resourceType.value.field_type,
    resourceContent: "",
    resourceLabel: resourceType.value.field_label,
    gameID: props.gameId,
    operatorID: operatorID.value,
    language: language.value,
    field_id: resourceType.value.id,
    field_values: resourceType.value.field_values,
    source: "empty",
    isDefault: false,
  });
};

const deleteResource = (resource: ResourceType, index: number) => {
  if (!resource.id) {
    resources.value.splice(index, 1);
  }
};

const convertGetFields = (field: string, type: ResourceEnum) => {
  try {
    switch (type) {
      case ResourceEnum.MULTISELECT:
        if (!field) return [];

        const content = JSON.parse(field);
        if (content && Array.isArray(content)) {
          return content;
        }
        return [];
      case ResourceEnum.BOOLEAN:
        return field === "1" || field === "true";
      default:
        return field;
    }
  } catch (err) {
    console.log("converting error", err);
  }

  return type === ResourceEnum.MULTISELECT ? [] : field;
};

const getFields = async (): Promise<void> => {
  if (!operatorID.value || !language.value) {
    resources.value = [];
    syncInitialResourcesSnapshot();
    return;
  }

  fieldsLoading.value = true;
  const { data } = await useAPIFetch("/resources/get", {
    operatorID: operatorID.value,
    gameID: props.gameId,
    language: language.value,
  });

  if (data && Array.isArray(data.fields)) {
    resources.value = data.fields.map((field: any) => ({
      id: field.id,
      resourceType: field.field_type,
      resourceContent: convertGetFields(field.content, field.field_type),
      resourceLabel: field.field_label,
      gameID: field.game_id,
      operatorID: field.operator_id,
      language: field.language,
      field_id: field.field_id,
      field_values: field.field_values,
      source: field.source,
      isDefault: Boolean(field.is_default),
    }));
  }

  syncInitialResourcesSnapshot();
  fieldsLoading.value = false;
};

const sanitizeJsonResource = (content: any) => {
  if (content === undefined || content === null) {
    return "";
  }

  if (typeof content === "string") {
    try {
      return JSON.stringify(JSON.parse(content));
    } catch {
      return content.replace(/\\[nr]/g, "");
    }
  }

  return JSON.stringify(content).replace(/\\[nr]/g, "");
};

const convertRespurce = (content: any, resourceType: ResourceEnum | null) => {
  switch (resourceType) {
    case ResourceEnum.JSON:
      return sanitizeJsonResource(content);
    case ResourceEnum.MULTISELECT:
      return sanitizeJsonResource(Array.isArray(content) ? content : []);
    case ResourceEnum.BOOLEAN:
      if (typeof content === "string") {
        const normalized = content.trim().toLowerCase();
        return normalized === "true" || normalized === "1";
      }
      return Boolean(content);
    default:
      return content;
  }
};

const getResourcesSnapshot = () => {
  return JSON.stringify(
    resources.value.map((resource) => ({
      id: resource.id,
      resourceType: resource.resourceType,
      resourceContent: convertRespurce(resource.resourceContent, resource.resourceType),
      resourceLabel: resource.resourceLabel,
      gameID: resource.gameID,
      operatorID: resource.operatorID,
      language: resource.language,
      field_id: resource.field_id,
    })),
  );
};

const syncInitialResourcesSnapshot = () => {
  initialResourcesSnapshot.value = getResourcesSnapshot();
};

const hasUnsavedChanges = computed(() => getResourcesSnapshot() !== initialResourcesSnapshot.value);

const getLanguages = async (): Promise<void> => {
  languagesLoading.value = true;
  const { data } = await useAPIFetch("/resources/languages");

  if (data && Array.isArray(data.languages)) {
    languageOptions.value = Array.from(new Set(["en", ...data.languages.filter(Boolean)]));
  }

  if (language.value && !languageOptions.value.includes(language.value)) {
    languageOptions.value.push(language.value);
  }

  languagesLoading.value = false;
};

const parseSelectField = (val: string): string[] => {
  if (!val) return [];

  return val.split(",").map((el) => el.trim());
};

const hasResourceContent = (content: any, resourceType: ResourceEnum | null) => {
  if (resourceType === ResourceEnum.BOOLEAN) {
    return content === true || content === false || content === "1" || content === "0";
  }

  if (Array.isArray(content)) {
    return content.length > 0;
  }

  return content !== undefined && content !== null && String(content) !== "";
};

const save = async (): Promise<void> => {
  const ResourcesToSave = resources.value
    .filter(
      (resource) =>
        resource.id || hasResourceContent(resource.resourceContent, resource.resourceType),
    )
    .map((resource) => ({
      operator_id: resource.operatorID,
      language: resource.language,
      content: convertRespurce(resource.resourceContent, resource.resourceType),
      game_id: resource.gameID,
      field_id: resource.field_id,
    }));

  const { success, data, error } = await useApiPostFetch(`/resources/save-resources`, {
    fields: ResourcesToSave,
    game_id: props.gameId,
    operator_id: operatorID.value,
    language: language.value,
  });
  if (success) {
    emitters("onSave");
    await getFields();
    return alertSuccess(data.message);
  }

  if (!success && error) {
    axiosErrorAlert(error);
  }
};

const getGameStatus = async (): Promise<void> => {
  const { data } = await useAPIFetch("/resources/operator-disabled-games", {
    operatorID: operatorID.value,
    gameID: props.gameId,
    env: authStore.user?.env,
  });

  deactivated.value =
    data?.data.filter(
      (item: any) =>
        parseInt(item.game_id) === props.gameId && item.operator_id === operatorID.value,
    )?.length > 0;
};

const saveOperatorActive = async () => {
  if (!operatorID.value) return;

  savingActive.value = true;

  const { data, success, error } = await useApiPostFetch("/resources/operator-active-games/save", {
    operatorID: operatorID.value,
    gameID: props.gameId,
    env: authStore.user?.env,
  });

  savingActive.value = false;

  if (success) {
    alertSuccess(data.message);
    return;
  }

  if (error) {
    axiosErrorAlert(error);
  }
};

const handleResourceLoading = (payload: number) => {
  hasOperatorSetup.value = payload > 0 ? true : false;
};

const handleOperatorSetup = () => {
  emitters("onOperatorSetup", operatorID.value);
};

const handleClose = () => {
  if (!hasUnsavedChanges.value) {
    emitters("onModalClose");
    return;
  }

  confirm({
    text: "You have unsaved changes. Are you sure you want to close without saving?",
    onClick: () => emitters("onModalClose"),
  });
};

const onMultiselectUpdated = (val: any) => {
  return Array.isArray(val) ? val.filter((v) => v !== "") : val;
};

watch(operatorID, () => {
  if (!operatorID.value) resources.value = [];
  getFields();
  getGameStatus();
});

watch(language, () => {
  getFields();
});

watch(
  props,
  () => {
    if (props.selectedOperatorId) {
      resources.value = [];
      operatorID.value = props.selectedOperatorId;
    }
  },
  { immediate: true },
);

watch(
  resources,
  () => {
    nextTick(() => {
      y.value = itemsList.value?.scrollHeight as number;
    });
  },
  { deep: true },
);

onMounted(() => {
  getLanguages();

  if (props.selectedOperatorId) {
    operatorID.value = props.selectedOperatorId;
  }
});
</script>
<template>
  <v-card class="mb-2" min-height="600">
    <v-card-title class="d-flex align-center justify-space-between">
      <span>{{ `Resources for game ${props.gameId}` }}</span>
      <v-btn color="primary" size="small" @click.prevent="handleClose">
        <v-icon>mdi-close</v-icon>
        Close
      </v-btn>
    </v-card-title>
    <v-card-text class="pb-0 pt-1">
      <v-row>
        <v-col cols="12" md="3">
          <SelectorOperators v-model="operatorID" />
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="language"
            :items="languageOptions"
            label="Language"
            hide-details
            variant="solo"
            density="compact"
            class="filter-search text-field-component"
            style="min-width: 200px"
            :loading="languagesLoading"
            :disabled="languagesLoading"
          />
        </v-col>
        <v-col cols="12" md="3">
          <SelectorResource
            v-model="resourceType"
            :operator-id="operatorID"
            @loading="handleResourceLoading"
          />
        </v-col>
        <v-col cols="12" md="1">
          <v-btn color="primary" block :disabled="!canAdd" @click.prevent="add">
            <v-icon size="small" color="white" icon="mdi-plus" />
            Add
          </v-btn>
        </v-col>
      </v-row>
      <div class="items__list" ref="itemsList">
        <v-alert v-if="!operatorID" type="info" variant="tonal">Please select an operator</v-alert>
        <v-alert v-if="operatorID && !hasOperatorSetup" type="error" variant="tonal">
          <div class="d-flex justify-space-between align-center">
            This operator does not have the fields set
            <v-btn @click.prevent="handleOperatorSetup">Operator Setup Fields</v-btn>
          </div>
        </v-alert>
        <v-progress-linear v-if="fieldsLoading" color="green" indeterminate></v-progress-linear>

        <v-row v-if="operatorID && resources.length > 0">
          <v-col cols="12" md="12">
            <div class="d-flex justify-start align-center ga-5">
              <v-checkbox
                v-model="deactivated"
                label="Deactivated"
                hide-details
                density="compact"
              />
              <v-btn
                size="small"
                color="blue"
                @click.prevent="saveOperatorActive"
                :loading="savingActive"
              >
                Save
              </v-btn>
            </div>
          </v-col>
        </v-row>
        <TransitionGroup name="list">
          <v-row v-for="(resource, index) in resources" :key="resource as any" align-center>
            <v-col cols="6" class="pt-1 pb-1">
              <v-textarea
                v-if="resource.resourceType === ResourceEnum.TEXTAREA"
                :rows="3"
                :cols="2"
                v-model="resource.resourceContent"
                hide-details
                variant="outlined"
                density="compact"
                class="filter-search text-field-component"
                :label="`${resource.resourceLabel}`"
              />
              <v-textarea
                v-if="resource.resourceType === ResourceEnum.JSON"
                :rows="10"
                :cols="2"
                v-model="resource.resourceContent"
                hide-details
                variant="outlined"
                density="compact"
                class="filter-search text-field-component"
                :label="`${resource.resourceLabel}`"
              />
              <v-checkbox
                v-if="resource.resourceType === ResourceEnum.BOOLEAN"
                v-model="resource.resourceContent"
                hide-details
                density="compact"
                :label="`${resource.resourceLabel}`"
              />
              <v-text-field
                v-if="
                  [ResourceEnum.TEXT, ResourceEnum.NUMBER].indexOf(resource.resourceType as any) !==
                  -1
                "
                v-model="resource.resourceContent"
                :type="resource.resourceType as any"
                hide-details
                variant="outlined"
                density="compact"
                class="filter-search text-field-component"
                :label="`${resource.resourceLabel}`"
              />
              <v-file-input
                v-if="resource.resourceType === ResourceEnum.FILE"
                v-model="resource.resourceContent"
                :label="`${resource.resourceLabel}`"
              />
              <v-select
                v-if="resource.resourceType === ResourceEnum.SELECT"
                v-model="resource.resourceContent"
                :label="`${resource.resourceLabel}`"
                :items="parseSelectField(resource.field_values)"
                variant="solo"
                density="compact"
                class="filter-search text-field-component"
              />

              <v-select
                v-if="resource.resourceType === ResourceEnum.MULTISELECT"
                v-model="resource.resourceContent"
                :label="`${resource.resourceLabel}`"
                :items="parseSelectField(resource.field_values)"
                variant="solo"
                density="compact"
                class="filter-search text-field-component"
                multiple
                @update:modelValue="(val) => (resource.resourceContent = onMultiselectUpdated(val))"
              />
            </v-col>
            <v-col cols="2" class="pt-1 pb-1">
              <v-chip>{{ resource.operatorID }}</v-chip>
            </v-col>
            <v-col cols="2" class="pt-1 pb-1">
              <div class="d-flex flex-column ga-1 align-start">
                <v-chip>Language: {{ resource.language }}</v-chip>
                <v-chip
                  v-if="resource.source === 'generic'"
                  color="blue"
                  variant="tonal"
                  size="small"
                >
                  Generic default
                </v-chip>
                <v-chip
                  v-else-if="resource.source === 'manual'"
                  color="green"
                  variant="tonal"
                  size="small"
                >
                  Manual
                </v-chip>
              </div>
            </v-col>
            <v-col cols="2" class="pt-1 pb-1">
              <v-btn
                @click="deleteResource(resource, index)"
                color="red"
                size="small"
                icon="mdi-delete-outline"
              />
            </v-col>
          </v-row>
        </TransitionGroup>
      </div>
    </v-card-text>
    <v-card-actions class="d-flex justify-center w-100">
      <v-btn @click.prevent="save" color="primary" variant="flat" size="x-large" class="px-8">
        <v-icon icon="mdi-content-save" />
        Save
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
