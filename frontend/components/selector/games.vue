<script setup lang="ts">
import { useSelector } from './useSelector';
const { games, getGames } = useSelector();

//props 
const props = defineProps({
	defaultValue: {
		type: Number,
		required: false,
		default: -1,
	},
})

//models
const customKey = ref<string>("GamesSelector");
const model = ref<any>(props.defaultValue !== -1 ? props.defaultValue : []);
const loading = ref<boolean>(true);

//@ts-ignore
watch(props.defaultValue, () => {
	model.value = props.defaultValue;
})

//mounted
onMounted(async () => {
	await getGames();
	loading.value = false;
});
</script>
<template>
	<v-autocomplete v-model="model" :items="games" label="Game" :item-title="'label'" :item-value="'id'" :key="customKey"
		:disabled="loading" hide-details variant="solo" density="compact" clearable hide-selected
		class="menu-select-filter menu-select-autocomplete">
		<template v-slot:item="{ props, item }">
			<v-list-item v-bind="props" :title="`${item.raw.label} (${item.raw.id})`"></v-list-item>
		</template>
	</v-autocomplete>
</template>
