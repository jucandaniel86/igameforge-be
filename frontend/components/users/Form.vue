<script setup lang="ts">
import type { UserType } from "./Utils";

import { useAlert } from "#imports";

interface UserFormI {
  item?: UserType;
}
//props
const props = defineProps<UserFormI>();

//model
const valid = ref<boolean>(true);
const showPassword = ref<boolean>(false);
const form = ref<any>({
  name: "",
  email: "",
  password: "",
  id: 0,
  user_type: "admin",
  site_id: "",
  provider_id: "",
  roles: null,
  environments: {
    envs: [],
    defaultEnv: "",
  },
});
const rules = ref<any>({
  required: (value: any) => !!value || "Required.",
  min: (v: any) => String(v).length >= 6 || "Min 8 characters",
});
const { axiosErrorAlert, alertSuccess } = useAlert();
const userTypes = [
  { id: "admin", label: "Admin" },
  { id: "operator", label: "Operator" },
];
const roles = ref<any[]>([]);
const rolesLoading = ref<boolean>(false);

const syncFormItem = () => {
  if (!props.item) return;

  form.value = { ...form.value, ...props.item };
  form.value.environments = {
    envs: Array.isArray((props.item as any).allowed_envs) ? (props.item as any).allowed_envs : [],
    defaultEnv: (props.item as any).env || "",
  };
  form.value.roles = (props.item as any)?.role_id || null;
};

//created
syncFormItem();

//watcher
watch(() => props.item, syncFormItem);

//emitters
const emitters = defineEmits(["users:close-modal", "users:reload-list"]);

//methods
const generatePassword = () => {
  var chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var passwordLength = 6;
  var password = "";

  for (var i = 0; i <= passwordLength; i++) {
    var randomNumber = Math.floor(Math.random() * chars.length);
    password += chars.substring(randomNumber, randomNumber + 1);
  }

  form.value.password = password;
  showPassword.value = true;
};

const validate = async () => {
  const action = typeof props.item?.id !== "undefined" ? "update" : "save";
  const payload = { ...form.value };

  if (!payload.roles) {
    delete payload.roles;
  }
  const { success, data, error } = await useApiPostFetch(`/users/${action}`, payload);

  if (success) {
    alertSuccess(data.message);
    emitters("users:close-modal");
    emitters("users:reload-list");
    return;
  }
  if (!success && error) {
    axiosErrorAlert(error);
  }
};

const loadRoles = async () => {
  rolesLoading.value = true;
  const { success, data } = await useAPIFetch("/roles/list", {
    start: 1,
    length: 500,
  });
  if (success) {
    roles.value = (data?.data?.items || []).map((role: any) => ({
      id: role.id,
      label: role.name,
    }));
  }
  rolesLoading.value = false;
};

onMounted(() => {
  loadRoles();
});
</script>
<template>
  <CommonCard title="Save User">
    <div class="pa-3">
      <v-text-field
        v-model="form.name"
        :rules="[rules.required]"
        label="Name"
        variant="outlined"
        density="compact"
        class="filter-search text-field-component"
        new-password
      ></v-text-field>

      <v-text-field
        v-model="form.email"
        :rules="[rules.required]"
        label="Email"
        autocomplete="new-password"
        variant="outlined"
        density="compact"
        class="filter-search text-field-component"
      ></v-text-field>

      <v-select
        v-model="form.roles"
        :items="roles"
        item-title="label"
        item-value="id"
        label="Role"
        :loading="rolesLoading"
        clearable
      />

      <div class="pb-2" v-if="form.roles === 2">
        <SelectorOperators v-model="form.site_id" :default-value="form.site_id" />
      </div>

      <div class="pb-2" v-if="form.roles === 3">
        <SelectorProviders v-model="form.provider_id" :default-value="form.provider_id" />
      </div>

      <div class="pb-2">
        <SelectorEnvironment v-model="form.environments" />
      </div>

      <div v-if="!item">
        <v-btn elevation="2" small @click="generatePassword" class="mt-2 mb-2">
          Random password
        </v-btn>
        <v-text-field
          v-model="form.password"
          :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          :rules="[rules.required, rules.min]"
          :type="showPassword ? 'text' : 'password'"
          name="input-10-1"
          label="Password"
          hint="At least 8 characters"
          variant="outlined"
          density="compact"
          class="filter-search text-field-component"
          autocomplete="new-password"
          counter
          @click:append="showPassword = !showPassword"
        ></v-text-field>
      </div>

      <div class="d-flex justify-space-between w-100">
        <v-btn
          :disabled="!valid"
          color="success"
          class="btn btn-primary"
          type="button"
          @click="validate"
        >
          <i class="mdi mdi-content-save" />
          Save
        </v-btn>
        <v-btn color="grey" class="btn" type="button" @click="emitters('users:close-modal')">
          <i class="mdi mdi-close" />
          Close
        </v-btn>
      </div>
    </div>
  </CommonCard>
</template>
