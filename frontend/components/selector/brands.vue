<script setup lang="ts">
	interface BrandSelectorI { 
		defaultValue?: String | Number | undefined
		client: Number
	}

	//props
	const props = defineProps<BrandSelectorI>();

	//models
	const customKey = ref<string>("BrandsSelector");
	const items = ref<any[]>([]);
	const model = ref<any>(props.defaultValue || []);
	const loading = ref<boolean>(false);
	
	//@ts-ignore
	watch(props.defaultValue, () => {
		model.value = props.defaultValue;
	});

	const getItems = async () => {
		loading.value = true;
		const { data, success } = await useAPIFetch('/selector/brands', {
			client_id: props.client
		});

		if(success) {
			items.value = data.data;
		}
		loading.value = false;
	}

	onMounted(() => {
		getItems();
	})
</script>
<template> 
	<v-autocomplete
		v-model="model"
		:items="items"
		label="Brand"
		:item-title="'name'"
		:item-value="'id'"
		:key="customKey" 
		:disabled="loading"
		return-object
		hide-details
		variant="solo"
		density="compact"
		clearable
    hide-selected 
		class="menu-select-filter menu-select-autocomplete"
	></v-autocomplete> 
</template>