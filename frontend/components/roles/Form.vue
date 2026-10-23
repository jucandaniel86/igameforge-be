<script setup lang="ts">
import type { RoleType } from "./Utils";

const props = defineProps<{
  item?: RoleType;
}>();

const emitters = defineEmits(["roles:close-modal", "roles:reload-list"]);

const form = ref<any>({
  id: 0,
  name: "",
  guard_name: "api",
  description: "",
});

const rules = {
  required: (value: any) => !!value || "Required.",
};

const { alertSuccess, axiosErrorAlert } = useAlert();

if (props.item) {
  form.value = { ...form.value, ...props.item };
}

watch(props, () => {
  form.value = { ...form.value, ...props.item };
});

const save = async () => {
  const action = props.item?.id ? "update" : "save";
  const { success, data, error } = await useApiPostFetch(
    `/roles/${action}`,
    form.value
  );

  if (success) {
    alertSuccess(data.message);
    emitters("roles:close-modal");
    emitters("roles:reload-list");
    return;
  }

  if (error) {
    axiosErrorAlert(error);
  }
};
</script>

<template>
  <CommonCard title="Save Role">
    <div class="pa-3">
      <v-text-field
        v-model="form.name"
        :rules="[rules.required]"
        label="Name"
        variant="outlined"
        density="compact"
        class="filter-search text-field-component"
      />

      <v-text-field
        v-model="form.guard_name"
        :rules="[rules.required]"
        label="Guard"
        variant="outlined"
        density="compact"
        class="filter-search text-field-component"
      />

      <v-textarea
        v-model="form.description"
        label="Description"
        variant="outlined"
        density="compact"
        class="filter-search text-field-component"
        rows="2"
      />

      <v-btn color="success" class="btn btn-primary" type="button" @click="save">
        <i class="mdi mdi-content-save" />
        Save
      </v-btn>
    </div>
  </CommonCard>
</template>

