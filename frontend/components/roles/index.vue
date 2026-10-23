<script setup lang="ts">
import moment from "moment";
import type { ReportHeadersData } from "../reports/Types";
import type { RoleType } from "./Utils";

import RoleForm from "./Form.vue";
import RolePermissions from "./Permissions.vue";
import { usePermissions } from "~/composables/usePermissions";

const { confirmDelete, alertSuccess, axiosErrorAlert } = useAlert();
const { can } = usePermissions();

const totalItems = ref<number>(0);
const items = ref<RoleType[]>([]);
const loading = ref<boolean>(true);
const searchText = ref<string>("");
const options = ref<any>({});
const selectedItem = ref<RoleType | undefined>();
const selectedRoleForPermissions = ref<RoleType | undefined>();
const modal = ref<boolean>(false);
const permissionsModal = ref<boolean>(false);

const headers = ref<ReportHeadersData[]>([
  {
    title: "Role",
    align: "start",
    sortable: false,
    value: "name",
    width: "35%",
  },
  {
    title: "Guard",
    align: "start",
    sortable: false,
    value: "guard_name",
    width: "15%",
  },
  {
    title: "Created at",
    align: "start",
    sortable: false,
    value: "created_at",
    width: "20%",
  },
  {
    title: "Actions",
    value: "iron",
    sortable: false,
    width: "30%",
  },
]);

watch(options, () => ({
  handler() {
    reloadList();
  },
  deep: true,
}));

const convertDate = (date?: string) =>
  date ? moment(date).format("MM/DD/YYYY H:mm") : "-";

const reloadList = async () => {
  loading.value = true;
  const { page, itemsPerPage } = options.value;

  const { success, data } = await useAPIFetch("/roles/list", {
    start: page,
    length: itemsPerPage,
    search: searchText.value,
  });

  if (success) {
    items.value = data.data.items;
    totalItems.value = data.data.total;
  }

  loading.value = false;
};

const add = () => {
  if (!can("roles.manage")) return;
  selectedItem.value = undefined;
  modal.value = true;
};

const edit = (item: RoleType) => {
  if (!can("roles.manage")) return;
  selectedItem.value = item;
  modal.value = true;
};

const managePermissions = (item: RoleType) => {
  if (!can("roles.manage")) return;
  selectedRoleForPermissions.value = item;
  permissionsModal.value = true;
};

const deleteItem = async (id: number) => {
  if (!can("roles.manage")) return;
  confirmDelete(async () => {
    const { success, data, error } = await useApiDeleteFetch("/roles/delete", {
      id,
    });

    if (success) {
      alertSuccess(data.message);
      reloadList();
      return;
    }

    if (error) {
      axiosErrorAlert(error);
    }
  });
};

onMounted(() => {
  reloadList();
});
</script>

<template>
  <v-data-table
    :headers="headers as any"
    :items="items"
    :options.sync="options"
    :server-items-length="totalItems"
    :loading="loading"
    :search="searchText"
    class="elevation-1 pa-2"
    :height="550"
  >
    <template v-slot:top>
      <v-row justify="end" class="align-center">
        <v-col cols="12" md="6" lg="3">
          <v-text-field
            v-model="searchText"
            label="Search"
            hide-details
            variant="outlined"
            density="compact"
            class="filter-search text-field-component"
          />
        </v-col>
        <v-col cols="auto">
          <v-btn color="secondary" @click="add" v-if="can('roles.manage')">
            <i class="mdi mdi-plus-circle-outline" /> Add role
          </v-btn>
        </v-col>
      </v-row>
    </template>

    <template v-slot:item="{ item }">
      <tr>
        <td class="custom-class">
          <b>{{ item.name }}</b>
          <div class="text-caption text-medium-emphasis">
            {{ item.description || "-" }}
          </div>
        </td>
        <td class="custom-class">{{ item.guard_name }}</td>
        <td class="custom-class">{{ convertDate(item.created_at) }}</td>
        <td class="custom-class">
          <v-btn
            icon="mdi-shield-check-outline icon-sm"
            color="info"
            density="compact"
            elevation="0"
            :variant="'elevated'"
            rounded
            class="mx-1"
            @click.prevent="managePermissions(item)"
            v-if="can('roles.manage')"
          />
          <v-btn
            icon="mdi-pencil-outline icon-sm"
            color="secondary"
            density="compact"
            elevation="0"
            :variant="'elevated'"
            rounded
            class="mx-1"
            @click.prevent="edit(item)"
            v-if="can('roles.manage')"
          />
          <v-btn
            icon="mdi-trash-can-outline icon-sm"
            color="danger"
            density="compact"
            elevation="0"
            :variant="'elevated'"
            rounded
            @click.prevent="deleteItem(item.id)"
            v-if="can('roles.manage')"
          />
        </td>
      </tr>
    </template>
  </v-data-table>

  <v-dialog
    v-model="modal"
    :height="'auto'"
    :maxWidth="600"
    width="100%"
    :scrollable="false"
    :adaptive="true"
    :styles="{ overflow: 'visible' }"
  >
    <RoleForm
      :item="selectedItem"
      @roles:close-modal="modal = false"
      @roles:reload-list="reloadList"
    />
  </v-dialog>

  <v-dialog v-model="permissionsModal" :maxWidth="1200" width="95%">
    <RolePermissions :role="selectedRoleForPermissions" />
  </v-dialog>
</template>
