<script setup lang="ts">
import { useSelector } from "./useSelector";

type EnvironmentModel = {
  envs: string[];
  defaultEnv: string;
};

const props = withDefaults(
  defineProps<{
    modelValue?: EnvironmentModel;
  }>(),
  {
    modelValue: () => ({
      envs: [],
      defaultEnv: "",
    }),
  },
);

const { getEnvironments } = useSelector();

const emitters = defineEmits(["update:modelValue"]);

const environments = ref<string[]>([]);
const envModel = ref<string[]>([]);
const defaultEnv = ref<string>("");
const loading = ref<boolean>(false);
let isSyncingModel = false;

const normalizeEnvironments = (items: any): string[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      if (typeof item === "string") return item;
      return item?.key || item?.value || item?.val || item?.label || "";
    })
    .filter(Boolean);
};

const emitValue = () => {
  if (isSyncingModel) return;

  emitters("update:modelValue", {
    envs: [...envModel.value],
    defaultEnv: defaultEnv.value,
  });
};

watch(
  () => props.modelValue,
  (value) => {
    isSyncingModel = true;
    envModel.value = Array.isArray(value?.envs) ? [...value.envs] : [];
    defaultEnv.value =
      value?.defaultEnv && envModel.value.includes(value.defaultEnv) ? value.defaultEnv : "";
    nextTick(() => {
      isSyncingModel = false;
    });
  },
  { deep: true, immediate: true },
);

watch(
  envModel,
  () => {
    if (defaultEnv.value && !envModel.value.includes(defaultEnv.value)) {
      defaultEnv.value = "";
      return;
    }

    emitValue();
  },
  { deep: true },
);

watch(defaultEnv, emitValue);

onMounted(async () => {
  loading.value = true;
  const { data, success } = await getEnvironments();

  if (success) {
    environments.value = normalizeEnvironments(data?.data || data);
  }

  loading.value = false;
});
</script>
<template>
  <v-table density="compact">
    <thead>
      <tr>
        <th>Environment</th>
        <th>Vizibile</th>
        <th>Default Env</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="loading">
        <td colspan="3">
          <v-progress-linear color="primary" indeterminate />
        </td>
      </tr>
      <tr v-for="env in environments" v-else :key="`Env_${env}`">
        <td>{{ env }}</td>
        <td>
          <v-checkbox v-model="envModel" :value="env" density="compact" hide-details />
        </td>
        <td>
          <input
            v-model="defaultEnv"
            type="radio"
            name="default-environment"
            :value="env"
            :disabled="envModel.indexOf(env) === -1"
          />
        </td>
      </tr>
    </tbody>
  </v-table>
</template>
