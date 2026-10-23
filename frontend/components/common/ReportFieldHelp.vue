<script setup lang="ts">
import {
  REPORT_FIELD_HELP,
  type ReportFieldHelpKey,
} from "~/app/reportFieldHelp";

const props = defineProps<{
  helpKey: ReportFieldHelpKey;
  currency?: string;
}>();

const dialog = ref(false);

const help = computed(() => REPORT_FIELD_HELP[props.helpKey]);
const nativeCurrency = computed(() => props.currency || help.value.nativeCurrency);
</script>

<template>
  <span v-if="help" class="report-field-help">
    <v-btn
      icon
      variant="text"
      density="compact"
      size="x-small"
      class="report-field-help__button"
      :aria-label="`Show calculation details for ${help.title}`"
      @click.stop="dialog = true"
    >
      <v-icon size="16">mdi-information-outline</v-icon>
    </v-btn>

    <v-dialog v-model="dialog" max-width="460">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ help.title }}</span>
          <v-btn icon variant="text" density="comfortable" @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <div class="report-field-help__section">
            <div class="text-caption text-medium-emphasis">Formula</div>
            <div class="font-weight-medium">{{ help.formula }}</div>
          </div>

          <div v-if="nativeCurrency" class="report-field-help__section">
            <div class="text-caption text-medium-emphasis">System currency</div>
            <div class="font-weight-medium">{{ nativeCurrency }}</div>
          </div>

          <div class="report-field-help__section">
            <div class="text-caption text-medium-emphasis">Description</div>
            <div>{{ help.description }}</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </span>
</template>
