<script setup lang="ts">



	//props
	const props = defineProps<{
		gameID: number | string;
	}>();

	//models
	const operatorID = ref<number | string>(0);
	const gameIds = ref	<number[]>([]);

	//emitters
	const on = defineEmits(["onCopyGameResources", "onCopyResourcesClosed"]);

	//methods
	const copyGameResources = () => {
		on("onCopyGameResources", {
			operatorID: operatorID.value,
			gameIds: gameIds.value,	
			gameID: props.gameID,
			});
	};
</script>
<template>
  <v-card max-width="400">
    <v-card-title>
      <div class="d-flex justify-space-between">
        <h3 class="text-h6">Copy Game Resources</h3>
      </div>
    </v-card-title>

		<v-card-text>
			<SelectorOperators v-model="operatorID" class="mb-2"/>
			<SelectorGames v-model="gameIds" :multiple="true" />
		</v-card-text>
   
    <v-card-actions>
      <div class="d-flex ga-1 justify-end">
				 <v-btn color="primary" size="small" @click="copyGameResources">
          <v-icon>mdi-content-save</v-icon>
          Save
        </v-btn>

        <v-btn color="primary" size="small" @click="on('onCopyResourcesClosed')">
          <v-icon>mdi-close</v-icon>
          Close
        </v-btn>
      </div>
    </v-card-actions>
  </v-card>
</template>
