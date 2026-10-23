<script setup lang="ts">
import { useSelector } from "./useSelector";
const { operators, getOperators } = useSelector();

//props
const props = defineProps({
  defaultValue: {
    type: [String, Array],
    required: false,
    default: "",
  },
  multiple: {
    type: Boolean,
    required: false,
    default: false,
  },
});

//models
const customKey = ref<string>("OperatorSelector");
const model = ref<any>(
  props.multiple
    ? Array.isArray(props.defaultValue)
      ? props.defaultValue
      : props.defaultValue
      ? String(props.defaultValue)
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      : []
    : props.defaultValue !== ""
    ? props.defaultValue
    : ""
);
const loading = ref<boolean>(true);

//emitters
const emitters = defineEmits(["input"]);

watch(
  model,
  (value) => {
    emitters("input", value);
  },
  { deep: true }
);

//@ts-ignore
watch(
  () => props.defaultValue,
  () => {
    if (props.multiple) {
      model.value = Array.isArray(props.defaultValue)
        ? props.defaultValue
        : props.defaultValue
        ? String(props.defaultValue)
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
        : [];
      return;
    }
    model.value = props.defaultValue !== "" ? props.defaultValue : "";
  }
);

//mounted
onMounted(async () => {
  await getOperators();
  loading.value = false;
});
</script>
<template>
  <v-autocomplete
    v-model="model"
    :items="operators"
    label="Operator"
    :item-title="'label'"
    :item-value="'id'"
    :key="customKey"
    :disabled="loading"
    :multiple="props.multiple"
    hide-details
    variant="solo"
    density="compact"
    clearable
    class="menu-select-filter menu-select-autocomplete"
  >
    <template v-slot:item="{ props: itemProps, item }">
      <v-list-item
        v-bind="itemProps"
        :title="`${item.raw.label} (${item.raw.id})`"
      >
        <template v-if="props.multiple" #prepend="{ isSelected }">
          <v-checkbox-btn :model-value="isSelected" :ripple="false" tabindex="-1" />
        </template>
      </v-list-item>
    </template>
  </v-autocomplete>
</template>
