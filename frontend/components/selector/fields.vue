<script setup lang="ts">
//props
const props = defineProps({
	defaultValue: {
		type: Number,
		required: false,
	},
	items: {
		required: true,
		type: Array,
		default: () => [],
	},
})
//models
const customKey = ref<string>("HiddenFieldsSelector");
const model = ref<any>([]);

onMounted(() => {
	model.value = props.items.map((el: any) => el.value);
})
</script>
<template>

	<v-select v-model="model" :items="items" placeholder="Hide Columns" item-title="title" item-value="value"
		:key="customKey" multiple hide-details variant="solo" density="compact" clearable
		class="menu-select-filter menu-select-autocomplete"></v-select>
</template>