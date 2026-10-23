<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { menuItems } from '@/app/menu';
import { useAuthStore } from '~/store/auth';

const open = defineModel<boolean>({ default: false });
const { public: { appName, version } } = useRuntimeConfig();
const { user } = storeToRefs(useAuthStore());
const auth = useAuthStore();
const changingEnvironment = ref(false);
const environments = computed(() => user.value?.allowedEnvs?.length
  ? user.value.allowedEnvs : [user.value?.env].filter(Boolean));

async function changeEnvironment(env: string) {
  changingEnvironment.value = true;
  try {
    const { success } = await useAPIFetch('/users/change-env', { env });
    if (success) window.location.reload();
  } finally {
    changingEnvironment.value = false;
  }
}

 
</script>

<template>
  <v-navigation-drawer v-model="open" :width="250" class="left-sidebar">
    <template #prepend>
      <NuxtLink to="/" class="sidebar-brand">
        {{ appName }} <sup>{{ version }}</sup>
      </NuxtLink>
    </template>

    <v-select
      :model-value="user?.env"
      :items="environments"
      label="Environment"
      :loading="changingEnvironment"
      :disabled="changingEnvironment"
      class="mx-3 mt-3"
      hide-details
      @update:model-value="changeEnvironment"
    />

    <v-list nav open-strategy="single" aria-label="Main navigation">
      <template v-for="item in menuItems" :key="item.id">
        <v-list-subheader v-if="item.isHeader">{{ item.label }}</v-list-subheader>
        <v-list-group v-else-if="item.subMenu?.length" :value="item.id">
          <template #activator="{ props }">
            <v-list-item v-bind="props" :title="item.label">
              <template #prepend><i :class="['mdi', item.icon, 'mr-3']" /></template>
            </v-list-item>
          </template>
          <template v-for="child in item.subMenu" :key="child.id || child.label">
            <v-list-group v-if="child.subMenu?.length" :value="child.id || child.label">
              <template #activator="{ props }">
                <v-list-item v-bind="props" :title="child.label" />
              </template>
              <v-list-item
                v-for="nested in child.subMenu"
                :key="nested.id || nested.label"
                :title="nested.label"
                :to="nested.link"
                exact
              />
            </v-list-group>
            <v-list-item v-else :title="child.label" :to="child.link" exact />
          </template>
        </v-list-group>
        <v-list-item v-else :title="item.label" :to="item.link" exact>
          <template #prepend><i :class="['mdi', item.icon, 'mr-3']" /></template>
        </v-list-item>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>
