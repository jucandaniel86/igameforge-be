<script setup lang="ts">
//types
type CopyResourcePropsType = {
  gameId: string | number;
};
type OperatorFromType = {
  operatorID: string;
  name: string;
  disabled: boolean;
};
//props
const props = defineProps<CopyResourcePropsType>();

//models
const operatorLoading = ref<boolean>(false);
const runLoading = ref<boolean>(false);
const operatorsFrom = ref<OperatorFromType[]>([]);
const operatorsTo = ref<OperatorFromType[]>([]);
const errorMessage = ref<string>("");
const successMessage = ref<string>("");
const form = ref({
  from_operator_id: "",
  to_operator_id: [],
});

//emitters
const emitters = defineEmits(["onClose", "onSuccess", "onError"]);

//methods
const getOperatorFrom = async (): Promise<void> => {
  const { success, data, error } = await useAPIFetch(
    `/resources/get-available-operators`,
    {
      gameID: props.gameId,
    }
  );
  if (success) {
    operatorsFrom.value = data.data.operators;
  }
};

const getOperatorTo = async (): Promise<void> => {
  const { success, data, error } = await useAPIFetch(
    `/resources/get-available-operators-to`,
    {
      gameID: props.gameId,
    }
  );
  if (success) {
    operatorsTo.value = data.data.operators;
  }
};

const handleOnClose = () => emitters("onClose");
const resetForm = () => {
  form.value = {
    from_operator_id: "",
    to_operator_id: [],
  };
};

const handleRun = async (): Promise<void> => {
  runLoading.value = true;
  const { success, data } = await useApiPostFetch(`/resources/copy`, {
    ...form.value,
    game_id: props.gameId,
  });
  if (success) {
    if (!data.data.success) {
      errorMessage.value = data.data.msg;
    } else {
      successMessage.value = data.data.msg;
      await Promise.all([getOperatorFrom(), getOperatorTo()]);
      resetForm();
      emitters("onSuccess");
    }
  }
  runLoading.value = false;
};

//computed
const operatorsToConverted = computed(() => {
  return operatorsTo.value.map((el) => ({
    ...el,
    props: {
      disabled: Boolean(el.disabled),
    },
  }));
});
const runButtonDisabled = computed(() => {
  return (
    form.value.from_operator_id === "" || form.value.to_operator_id.length === 0
  );
});

//onMounted
onMounted(async () => {
  operatorLoading.value = true;
  await Promise.all([getOperatorFrom(), getOperatorTo()]);
  operatorLoading.value = false;
});
</script>
<template>
  <v-card>
    <v-card-title>
      <div class="d-flex justify-start align-center ga-1">
        <v-icon icon="mdi-content-copy" />
        <h3 class="text-h6">COPY GAME RESOURCE</h3>
      </div>
    </v-card-title>
    <v-card-text>
      <v-progress-linear indeterminate v-if="operatorLoading" />
      <div>
        <v-select
          v-model="form.from_operator_id"
          label="FROM:"
          :items="operatorsFrom"
          item-title="name"
          item-value="site_id"
          hide-details
          density="compact"
          :disabled="operatorsFrom.length === 0 || operatorLoading"
          variant="solo"
        />
        <v-autocomplete
          v-model="form.to_operator_id"
          label="TO:"
          :items="operatorsToConverted"
          hide-details
          density="compact"
          :disabled="operatorsTo.length === 0 || operatorLoading"
          multiple
          clearable
          variant="solo"
          class="mt-2"
        />
      </div>
      <v-alert
        v-if="errorMessage"
        border="top"
        type="warning"
        variant="outlined"
        density="compact"
        class="mt-1"
      >
        {{ errorMessage }}
      </v-alert>
      <v-alert
        v-if="successMessage"
        border="top"
        type="success"
        variant="outlined"
        density="compact"
        class="mt-1"
      >
        {{ successMessage }}
      </v-alert>
    </v-card-text>
    <v-card-actions>
      <v-btn
        prepend-icon="mdi-play-outline"
        text="Run"
        color="blue"
        :disabled="runButtonDisabled || runLoading"
        @click.prevent="handleRun"
      />
      <v-btn
        prepend-icon="mdi-close"
        text="Close"
        color="grey"
        @click.prevent="handleOnClose"
      />
    </v-card-actions>
  </v-card>
</template>
