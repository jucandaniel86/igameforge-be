<script setup lang="ts">
//type
type SelectorResouceT = {
  operatorId: any;
};
const props = defineProps<SelectorResouceT>();

//models
const items = ref<any[]>([]);
const loading = ref<boolean>(false);
const k = ref("aa");

//emitters
const emitters = defineEmits(["update:modelValue", "loading"]);

//methods
const getItems = async () => {
  loading.value = true;
  const { data, success } = await useAPIFetch(
    "/resources/operator-fields/get",
    {
      operatorID: props.operatorId,
    }
  );

  if (success) {
    items.value = data.fields || [];
  }
  emitters("loading", items.value.length);
  loading.value = false;
};

const onChange = (val: any) => {
  emitters("update:modelValue", val);
};

watch(
  () => props.operatorId,
  async (operatorId) => {
    if (operatorId) {
      await getItems();

      k.value = `K${new Date().getTime()}`;
      return onChange(null);
    }
    items.value = [];
    k.value = `K${new Date().getTime()}`;
  },
  { immediate: true }
);
</script>
<template>
  <div>
    <v-select
      @update:model-value="onChange"
      :items="items"
      label="Resource type"
      :item-title="'field_key'"
      :item-value="'id'"
      :return-object="true"
      :disabled="loading"
      hide-details
      variant="solo"
      density="compact"
      class="menu-select-filter menu-select-autocomplete"
      :key="k"
    ></v-select>
  </div>
</template>
