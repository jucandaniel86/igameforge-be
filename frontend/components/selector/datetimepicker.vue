<script setup lang="ts">
import moment from "moment";

const props = withDefaults(
  defineProps<{
    modelValue?: any[];
    timezone?: string;
  }>(),
  {
    modelValue: () => [moment().subtract(1, "week").toDate(), moment().toDate()],
    timezone: "UTC",
  },
);
const emit = defineEmits(["update:modelValue", "update:timezone"]);

const range = computed({
  get: () => props.modelValue,
  set: (value: any[]) => emit("update:modelValue", value),
});
const timezone = computed({
  get: () => props.timezone || "UTC",
  set: (value: string) => emit("update:timezone", value),
});
const timezoneMenu = ref(false);

const timezoneItems = [
  { title: "(UTC+00:00) UTC", value: "UTC" },
  { title: "(UTC-11:00) Pacific/Pago_Pago", value: "Pacific/Pago_Pago" },
  { title: "(UTC-10:00) Pacific/Honolulu", value: "Pacific/Honolulu" },
  { title: "(UTC-09:00) America/Anchorage", value: "America/Anchorage" },
  { title: "(UTC-08:00) America/Los_Angeles", value: "America/Los_Angeles" },
  { title: "(UTC-07:00) America/Denver", value: "America/Denver" },
  { title: "(UTC-06:00) America/Chicago", value: "America/Chicago" },
  { title: "(UTC-05:00) America/New_York", value: "America/New_York" },
  { title: "(UTC-04:00) America/Halifax", value: "America/Halifax" },
  { title: "(UTC-03:00) America/Sao_Paulo", value: "America/Sao_Paulo" },
  {
    title: "(UTC-02:00) Atlantic/South_Georgia",
    value: "Atlantic/South_Georgia",
  },
  { title: "(UTC-01:00) Atlantic/Azores", value: "Atlantic/Azores" },
  { title: "(UTC+01:00) Europe/Berlin", value: "Europe/Berlin" },
  { title: "(UTC+02:00) Europe/Bucharest", value: "Europe/Bucharest" },
  { title: "(UTC+03:00) Europe/Moscow", value: "Europe/Moscow" },
  { title: "(UTC+04:00) Asia/Dubai", value: "Asia/Dubai" },
  { title: "(UTC+05:00) Asia/Karachi", value: "Asia/Karachi" },
  { title: "(UTC+06:00) Asia/Dhaka", value: "Asia/Dhaka" },
  { title: "(UTC+07:00) Asia/Bangkok", value: "Asia/Bangkok" },
  { title: "(UTC+08:00) Asia/Singapore", value: "Asia/Singapore" },
  { title: "(UTC+09:00) Asia/Tokyo", value: "Asia/Tokyo" },
  { title: "(UTC+10:00) Australia/Sydney", value: "Australia/Sydney" },
  { title: "(UTC+11:00) Pacific/Noumea", value: "Pacific/Noumea" },
  { title: "(UTC+12:00) Pacific/Auckland", value: "Pacific/Auckland" },
];

const selectedTimezoneLabel = computed(() => {
  return (
    timezoneItems.find((item) => item.value === timezone.value)?.title || "UTC"
  );
});

const selectTimezone = (value: string) => {
  timezone.value = value;
  timezoneMenu.value = false;
};
</script>
<template>
  <div class="d-flex align-center ga-1 flex-nowrap">
    <VueDateTimePicker
      :key="`dp-${timezone}`"
      v-model="range"
      :range="{ partialRange: false }"
      :teleport="true"
      :timezone="{ timezone, convertModel: false }"
    />
    <v-menu v-model="timezoneMenu" :close-on-content-click="false" location="bottom end">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          icon
          size="x-small"
          density="comfortable"
          variant="tonal"
          color="primary"
          :title="selectedTimezoneLabel"
        >
          <v-icon>mdi-earth</v-icon>
        </v-btn>
      </template>
      <v-card min-width="340" max-height="360" class="overflow-auto">
        <v-list density="compact">
          <v-list-item
            v-for="item in timezoneItems"
            :key="item.value"
            :active="timezone === item.value"
            @click="selectTimezone(item.value)"
          >
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
  </div>
</template>
