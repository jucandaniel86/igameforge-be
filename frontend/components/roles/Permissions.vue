<script setup lang="ts">
import type { PermissionType, RoleType } from "./Utils";
import { usePermissions } from "~/composables/usePermissions";

const props = defineProps<{
  role?: RoleType;
}>();

const { alertSuccess, axiosErrorAlert } = useAlert();
const { can } = usePermissions();

const loading = ref(false);
const permissions = ref<PermissionType[]>([]);
const selectedPermissionIds = ref<number[]>([]);
const initialPermissionIds = ref<number[]>([]);

const groupedPermissions = computed(() => {
  const grouped: Record<string, PermissionType[]> = {};
  permissions.value.forEach((permission) => {
    const key = permission.resource || "other";
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(permission);
  });

  return Object.keys(grouped)
    .sort()
    .map((key) => ({
      resource: key,
      items: grouped[key].sort((a, b) => a.name.localeCompare(b.name)),
    }));
});

const loadPermissions = async () => {
  if (!props.role?.id) {
    return;
  }

  loading.value = true;

  const [allPermissions, rolePermissions] = await Promise.all([
    useAPIFetch("/roles/permissions/list", {
      start: 1,
      length: 500,
    }),
    useAPIFetch("/roles/permissions/by-role", {
      role_id: props.role.id,
    }),
  ]);

  if (allPermissions.success) {
    permissions.value = allPermissions.data.data.items || [];
  }

  if (rolePermissions.success) {
    const ids = rolePermissions.data.data.permission_ids || [];
    selectedPermissionIds.value = [...ids];
    initialPermissionIds.value = [...ids];
  }

  loading.value = false;
};

const save = async () => {
  if (!can("roles.manage")) {
    return;
  }

  if (!props.role?.id) {
    return;
  }

  const initialSet = new Set(initialPermissionIds.value);
  const selectedSet = new Set(selectedPermissionIds.value);

  const toAttach = [...selectedSet].filter((id) => !initialSet.has(id));
  const toDetach = [...initialSet].filter((id) => !selectedSet.has(id));

  if (!toAttach.length && !toDetach.length) {
    alertSuccess("No changes to save");
    return;
  }

  loading.value = true;

  if (toAttach.length) {
    const { success, error } = await useApiPostFetch("/roles/permissions/attach", {
      role_id: props.role.id,
      permission_ids: toAttach,
    });

    if (!success && error) {
      loading.value = false;
      return axiosErrorAlert(error);
    }
  }

  if (toDetach.length) {
    const { success, error } = await useApiPostFetch("/roles/permissions/detach", {
      role_id: props.role.id,
      permission_ids: toDetach,
    });

    if (!success && error) {
      loading.value = false;
      return axiosErrorAlert(error);
    }
  }

  initialPermissionIds.value = [...selectedPermissionIds.value];
  loading.value = false;
  alertSuccess("Role permissions were saved successfuly");
};

watch(
  () => props.role?.id,
  () => {
    loadPermissions();
  },
  {
    immediate: true,
  }
);
</script>

<template>
  <CommonCard :title="`Permissions: ${role?.name || ''}`">
    <div class="pa-3">
      <v-alert
        type="info"
        variant="tonal"
        class="mb-3"
        density="compact"
      >
        Select permissions and press Save.
      </v-alert>

      <div v-if="loading" class="py-4 d-flex justify-center">
        <v-progress-circular indeterminate />
      </div>

      <div v-else>
        <div v-for="group in groupedPermissions" :key="group.resource" class="mb-4">
          <h4 class="text-uppercase text-caption mb-2">{{ group.resource }}</h4>
          <v-row>
            <v-col
              v-for="permission in group.items"
              :key="permission.id"
              cols="12"
              md="6"
              lg="4"
              class="py-0"
            >
              <v-checkbox
                v-model="selectedPermissionIds"
                :value="permission.id"
                density="compact"
                hide-details
                :label="permission.name"
              />
            </v-col>
          </v-row>
        </div>
      </div>

      <v-btn color="success" @click="save" :disabled="loading || !can('roles.manage')">
        <i class="mdi mdi-content-save" />
        Save
      </v-btn>
    </div>
  </CommonCard>
</template>
