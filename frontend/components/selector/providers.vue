<script setup lang="ts">
interface BrandSelectorI {
  defaultValue?: any;
  multiple?: boolean;
}

//props
const props = defineProps<BrandSelectorI>();

//models
const customKey = ref<string>("ProviderSelector");
const items = ref<any[]>([]);
const model = ref<any>(props.defaultValue || []);
const loading = ref<boolean>(false);

//emitters
const emitters = defineEmits(["input"]);

//@ts-ignore
watch(props.defaultValue, () => {
  model.value = props.defaultValue;
});

const modelUpdate = (_value: any) => {
  emitters("input", _value);
};

const getItems = async () => {
  loading.value = true;
  const { data, success } = await useAPIFetch("/selector/providers");

  if (success) {
    items.value = data.data;
  }
  loading.value = false;
};

onMounted(() => {
  getItems();
});
</script>
<template>
  <v-autocomplete
    v-model="model"
    @update:model-value="modelUpdate"
    :items="items"
    label="Provider"
    :item-title="'label'"
    :item-value="'label'"
    :key="customKey"
    :disabled="loading"
    :multiple="props.multiple || false"
    hide-details
    variant="solo"
    density="compact"
    clearable
    class="menu-select-filter menu-select-autocomplete"
  ></v-autocomplete>
</template>
