<script setup lang="ts">
import type { ReportHeadersData } from "../reports/Types";
import type { PermissionType } from "../roles/Utils";

const totalItems = ref<number>(0);
const items = ref<PermissionType[]>([]);
const loading = ref<boolean>(true);
const searchText = ref<string>("");
const options = ref<any>({});

const headers = ref<ReportHeadersData[]>([
  {
    title: "Permission",
    align: "start",
    sortable: false,
    value: "name",
    width: "40%",
  },
  {
    title: "Resource",
    align: "start",
    sortable: false,
    value: "resource",
    width: "20%",
  },
  {
    title: "Action",
    align: "start",
    sortable: false,
    value: "action",
    width: "20%",
  },
  {
    title: "Guard",
    align: "start",
    sortable: false,
    value: "guard_name",
    width: "20%",
  },
]);

watch(options, () => ({
  handler() {
    reloadList();
  },
  deep: true,
}));

const reloadList = async () => {
  loading.value = true;
  const { page, itemsPerPage } = options.value;

  const { success, data } = await useAPIFetch("/roles/permissions/list", {
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
        <td class="custom-class">{{ item.resource || "-" }}</td>
        <td class="custom-class">{{ item.action || "-" }}</td>
        <td class="custom-class">{{ item.guard_name }}</td>
      </tr>
    </template>
  </v-data-table>
</template>

