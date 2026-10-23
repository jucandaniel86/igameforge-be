<script setup lang="ts">
import { PERMISSIONS_BREADCRUMBS } from "~/components/users/Utils";
import PermissionsList from "~/components/permissions/index.vue";

useSeoMeta({
  title: "Permissions",
  ogTitle: "Permissions",
});

definePageMeta({
  middleware: ["auth", "permission"],
  permission: ["roles.view", "users.manage"],
});
</script>

<template>
  <CommonBreadcrumb title="Permissions" :items="PERMISSIONS_BREADCRUMBS" />
  <PermissionsList />
</template>
