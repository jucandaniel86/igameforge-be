<script setup lang="ts">
const timezone = defineModel<string>("timezone", {
  default: "UTC",
});

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
</script>
<template>
  <v-select
    v-model="timezone"
    :items="timezoneItems"
    label="Timezone"
    hide-details
    density="compact"
    variant="solo"
    class="timezone-select"
    style="min-width: 220px"
  />
</template>
