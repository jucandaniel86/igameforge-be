<script setup lang="ts">
	import { USERS_BRANDCRUMBS } from '~/components/users/Utils';	
	import UsersList from '~/components/users/index.vue';

	useSeoMeta({
		title: 'Users',
		ogTitle: 'Users',
	})

	definePageMeta({
		middleware: ['auth', 'permission'],
		permission: ['users.view', 'users.manage'],
	})
</script>
<template>
	<CommonBreadcrumb title="Users" :items="USERS_BRANDCRUMBS" />
	<UsersList />
</template>
