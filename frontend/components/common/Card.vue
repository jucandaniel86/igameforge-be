<script lang="ts">
export default {
	props: {
		title: {
			type: String,
			default: "",
		},
		titleClass: {
			type: String,
			default: "",
		},
		loading: {
			type: Boolean,
			default: false,
		}
	},
};
</script>
<template>
	<v-card :loading="loading">
		<v-card-title class="d-flex justify-space-between align-center py-4" :class="titleClass">
			<div class="d-flex align-center">
				<h4 class="text-body-1 font-weight-bold">
					{{ title }}
				</h4>
				<slot name="title-badge" />
			</div>
			<slot name="title-action" />
		</v-card-title>
		<slot />
	</v-card>
</template>
