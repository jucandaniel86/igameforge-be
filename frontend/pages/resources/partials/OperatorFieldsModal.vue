<script setup lang="ts">
//types
enum FieldTypeEnum {
  TEXT = "text",
  FILE = "file",
  TEXTAREA = "textarea",
  NUMBER = "number",
  BOOLEAN = "boolean",
  JSON = "json",
  SELECT = "select",
  MULTISELECT = "multiselect",
}

type GameResourceType = {
  id: number;
  field_key: string;
  field_label: string;
  field_type: string;
};

defineProps<{
  gameResourceTypes: GameResourceType[];
}>();

//models
const operatorID = ref();
const fields = ref<any[]>([]);
const isSaveLoading = ref<boolean>(false);
const listLoading = ref<boolean>(false);
const items = ref<any[]>([
  { id: FieldTypeEnum.TEXT, label: "Text" },
  { id: FieldTypeEnum.TEXTAREA, label: "Textarea" },
  { id: FieldTypeEnum.NUMBER, label: "Number" },
  { id: FieldTypeEnum.FILE, label: "File" },
  { id: FieldTypeEnum.JSON, label: "Json" },
  { id: FieldTypeEnum.BOOLEAN, label: "Boolean" },
  { id: FieldTypeEnum.SELECT, label: "Select" },
  { id: FieldTypeEnum.MULTISELECT, label: "Multiselect" },
]);
const saveForm = ref({
  field_label: "",
  field_key: "",
  field_type: "",
  field_values: "",
  game_resource_type_id: null as number | null,
  operatorID: 0,
});

//composables
const {
  alertSuccess,
  axiosErrorAlert,
  alertError,
  alertWarning,
  confirmDelete,
} = useAlert();

//emitters
const emitters = defineEmits(["onModalClose"]);

//methods
const resetSaveForm = () => {
  saveForm.value = {
    field_label: "",
    field_key: "",
    field_type: "",
    field_values: "",
    game_resource_type_id: null,
    operatorID: 0,
  };
};
const onSave = async (): Promise<void> => {
  if (!operatorID.value) {
    return alertWarning("Invalid Operator");
  }

  isSaveLoading.value = true;
  const { success, data, error } = await useApiPostFetch(
    `/resources/operator-fields/save`,
    {
      ...saveForm.value,
      operatorID: operatorID.value,
    },
  );
  isSaveLoading.value = false;
  if (success) {
    alertSuccess(data.message);
    resetSaveForm();
    getFields();
    return;
  }

  if (!success && error) {
    axiosErrorAlert(error);
  }
};
const getFields = async (): Promise<void> => {
  listLoading.value = true;
  const { success, data, error } = await useAPIFetch(
    `/resources/operator-fields/get`,
    {
      operatorID: operatorID.value,
    },
  );
  if (success) {
    fields.value = data.fields;
  }
  listLoading.value = false;
};

const deleteField = async (fieldID: number): Promise<void> => {
  await confirmDelete(async () => {
    const { data, success } = await useApiDeleteFetch(
      "/resources/operator-fields/delete",
      {
        fieldID,
      },
    );

    if (!data.success) {
      return alertError(data.msg);
    }

    alertSuccess(data.msg);
    getFields();
  });
};
const edit = async (field: any): Promise<void> => {
  const { success, data, error } = await useApiPostFetch(
    `/resources/operator-fields/save`,
    field,
  );
  if (success) {
    return alertSuccess(data.message);
  }

  if (!success && error) {
    axiosErrorAlert(error);
  }
};

//watchers
watch(operatorID, () => {
  getFields();
});
</script>
<template>
  <v-card>
    <v-card-title>
      <div class="d-flex justify-space-between">
        <h3 class="text-h6">Operator Fields</h3>
        <div class="w-50">
          <SelectorOperators v-model="operatorID" />
        </div>
      </div>
    </v-card-title>
    <v-card-text>
      <v-table density="compact" fixed-header striped="odd">
        <template #top>
          <v-progress-linear
            v-if="listLoading"
            color="green"
            indeterminate
          ></v-progress-linear>
        </template>
        <thead>
          <tr>
            <th width="22%">Label</th>
            <th width="22%">Key</th>
            <th width="20%">Type</th>
            <th width="24%">Generic Field</th>
            <th width="12%">Actions</th>
          </tr>
          <tr>
            <td class="pt-1 pb-1 pr-0 pl-1">
              <v-text-field
                v-model="saveForm.field_label"
                hide-details
                variant="outlined"
                density="compact"
                class="elevation-0"
              />
            </td>
            <td class="pt-1 pb-1 pr-0 pl-1">
              <v-text-field
                v-model="saveForm.field_key"
                hide-details
                variant="outlined"
                density="compact"
                class="elevation-0"
              />
            </td>
            <td class="pt-1 pb-1 pr-0 pl-1">
              <v-select
                v-model="saveForm.field_type"
                :items="items"
                :item-title="'label'"
                :item-value="'id'"
                hide-details
                variant="solo"
                density="compact"
                class="elevation-0"
              />
            </td>
            <td class="pt-1 pb-1 pr-0 pl-1">
              <v-select
                v-model="saveForm.game_resource_type_id"
                :items="gameResourceTypes"
                :item-title="'field_label'"
                :item-value="'id'"
                clearable
                hide-details
                variant="solo"
                density="compact"
                class="elevation-0"
              />
            </td>
            <td class="pt-1 pb-1 pr-0 pl-1">
              <v-btn
                color="secondary"
                :disabled="isSaveLoading"
                @click="onSave"
                size="small"
              >
                <i class="mdi mdi-plus-circle-outline" /> Add
              </v-btn>
            </td>
          </tr>
          <tr
            v-if="
              [FieldTypeEnum.SELECT, FieldTypeEnum.MULTISELECT].indexOf(
                saveForm.field_type as any,
              ) !== -1
            "
          >
            <td colspan="5" class="pt-1 pb-1 pr-0 pl-1">
              <v-textarea v-model="saveForm.field_values" label="Values" />
            </td>
          </tr>
        </thead>
        <tbody>
          <template v-for="(field, i) in fields" :key="`Fields${i}`">
            <tr>
              <td class="pt-1 pb-1 pr-0 pl-1">
                <v-text-field
                  v-model="field.field_label"
                  hide-details
                  variant="outlined"
                  density="compact"
                  class="elevation-0"
                />
              </td>
              <td class="pt-1 pb-1 pr-0 pl-1">
                <v-text-field
                  v-model="field.field_key"
                  hide-details
                  variant="outlined"
                  density="compact"
                  class="elevation-0"
                />
              </td>
              <td class="pt-1 pb-1 pr-0 pl-1">
                <v-select
                  v-model="field.field_type"
                  :items="items"
                  :item-title="'label'"
                  :item-value="'id'"
                  hide-details
                  variant="solo"
                  density="compact"
                  class="elevation-0"
                />
              </td>
              <td class="pt-1 pb-1 pr-0 pl-1">
                <v-select
                  v-model="field.game_resource_type_id"
                  :items="gameResourceTypes"
                  :item-title="'field_label'"
                  :item-value="'id'"
                  clearable
                  hide-details
                  variant="solo"
                  density="compact"
                  class="elevation-0"
                />
              </td>
              <td class="pt-1 pb-1 pr-0 pl-1">
                <v-btn
                  color="green"
                  size="x-small"
                  icon="mdi-content-save-outline"
                  @click.prevent="edit(field)"
                />
                <v-btn
                  color="red"
                  size="x-small"
                  icon="mdi-close"
                  @click="deleteField(field.id)"
                />
              </td>
            </tr>
            <tr
              v-if="
                [FieldTypeEnum.SELECT, FieldTypeEnum.MULTISELECT].indexOf(
                  field.field_type as any,
                ) !== -1
              "
            >
              <td colspan="5" class="pt-1 pb-1 pr-0 pl-1">
                <v-textarea
                  v-model="field.field_values"
                  variant="outlined"
                  density="compact"
                  class="elevation-0"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </v-table>
    </v-card-text>
    <v-card-actions>
      <div class="d-flex justify-end">
        <v-btn color="primary" size="small" @click="emitters('onModalClose')">
          <v-icon>mdi-close</v-icon>
          Close
        </v-btn>
      </div>
    </v-card-actions>
  </v-card>
</template>
