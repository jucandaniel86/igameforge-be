<script setup lang="ts">
import { type UserType } from "./Utils";

const props = defineProps<{
  item?: UserType;
}>();

type PasswordFormType = {
  new_password: string;
  new_password_confirmation: string;
  id?: number;
};

//models
const showPassword = ref<boolean>(false);
const form = ref<PasswordFormType>({
  new_password: "",
  new_password_confirmation: "",
  id: props.item?.id,
});
const passowrdForm = ref();
const { alertSuccess, axiosErrorAlert } = useAlert();

//emits
const emitters = defineEmits(["users:close-password-modal"]);

//methods
const generatePassword = () => {
  var chars =
    "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var passwordLength = 6;
  var password = "";

  for (var i = 0; i <= passwordLength; i++) {
    var randomNumber = Math.floor(Math.random() * chars.length);
    password += chars.substring(randomNumber, randomNumber + 1);
  }
  form.value.new_password = password;
  showPassword.value = true;
};

const validate = async () => {
  const { data, success, error } = await useApiPostFetch(
    "/users/change-password",
    form.value,
  );
  if (success) {
    alertSuccess(data.message);
    emitters("users:close-password-modal");
    return;
  }

  if (error) {
    axiosErrorAlert(error);
  }
};
</script>

<template>
  <CommonCard title="Update user password">
    <div class="pa-3">
      <v-btn elevation="2" small @click="generatePassword" class="mb-2">
        Random password
      </v-btn>

      <v-text-field
        v-model="form.new_password"
        :type="showPassword ? 'text' : 'password'"
        name="input-10-1"
        label="New  Password"
        variant="outlined"
        density="compact"
        class="filter-search text-field-component"
        autocomplete="new-password"
      ></v-text-field>

      <v-text-field
        v-model="form.new_password_confirmation"
        :type="'password'"
        name="input-10-1"
        label="Retype Password"
        variant="outlined"
        density="compact"
        class="filter-search text-field-component"
        autocomplete="new-password"
      ></v-text-field>

      <v-btn color="success" class="mr-2" @click="validate">
        <i class="mdi mdi-content-save" />
        Save
      </v-btn>

      <v-btn color="primary" @click="emitters('users:close-password-modal')">
        <i class="mdi mdi-close" />
        Close
      </v-btn>
    </div>
  </CommonCard>
</template>
