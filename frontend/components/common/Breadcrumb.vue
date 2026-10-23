<script lang="ts" setup>
import { type PropType } from "vue";
import { type BreadcrumbType } from "@/app/types";

const prop = defineProps({
  title: {
    type: String,
    default: ""
  },
  items: {
    type: Array as PropType<BreadcrumbType[]>,
    default: () => []
  }
});
</script>
<template>
  <div class="page-heading d-flex justify-space-between align-center">  
    <h2 class="text-subtitle-1 text-uppercase font-weight-bold">
      {{ title }}
    </h2>
    <v-breadcrumbs :items="items" class="breadcrumb-wrapper">
      <template v-slot:title="{ item }">
        <span class="">{{ item.title }}</span>
      </template>
      <template #divider>
        <v-icon icon="mdi-chevron-right icon-sm"></v-icon>
      </template>
    </v-breadcrumbs>
  </div>
</template>
