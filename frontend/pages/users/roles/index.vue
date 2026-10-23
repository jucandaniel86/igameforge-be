<script setup lang="ts">
import { ROLES_BREADCRUMBS } from "~/components/users/Utils";
import RolesList from "~/components/roles/index.vue";

useSeoMeta({
  title: "Roles",
  ogTitle: "Roles",
});

definePageMeta({
  middleware: ["auth", "permission"],
  permission: ["roles.view", "users.manage"],
});
</script>

<template>
  <CommonBreadcrumb title="Roles" :items="ROLES_BREADCRUMBS" />
  <RolesList />
</template>
