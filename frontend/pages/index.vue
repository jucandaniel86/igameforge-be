<script setup lang="ts"> 
import { DASHBOARD_BREADCRUMBS } from '~/app/breadcrumbs';
import { useAuthStore } from '~/store/auth';

const store = useAuthStore();
const { user } = storeToRefs(store); 

useSeoMeta({
  title: 'Dashboard',
  ogTitle: 'Dashboard',
})

definePageMeta({
	middleware: 'auth'
})
</script>

<template>
 	<CommonBreadcrumb title="Dashboard" :items="DASHBOARD_BREADCRUMBS" />
	 
	<v-card class="pa-6 mt-3" elevation="1">
		<div class="text-h6 font-weight-bold">
			Welcome {{ user?.name || 'user' }}
		</div>
	</v-card>
	
</template>
