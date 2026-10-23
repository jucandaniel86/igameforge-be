
<script setup lang="ts">
import { computed, ref, unref } from "vue"; 
 

const range = ref<any[]>([]);
const menu = ref(false);
const model = defineModel<Date[]>();
const dates = computed({
  get: datesBetween,
  set: updateRange,
});

const dateRangeText = computed(() => {
  if (model.value == undefined || model.value.length == 0) {
    return "Please select a date";
  }
  const [start, end] = unref(model) as any;
  if (!!start && !!end) {
    return `From ${start.toLocaleDateString()} To ${end.toLocaleDateString()}`;
  } else if (isToday(start)) {
    return "Today";
  } else {
    return start.toLocaleDateString();
  }
});

function updateRange(date: any) {
  const [start, end] = unref(range);
  //if everything is null or everything is not
  if (!!start === !!end) {
    range.value = [date];
  } else if (date < start) {
    range.value = [date, start];
  } else if (date > start) {
    range.value = [start, date];
  }
}

function datesBetween() {
  if (range.value == undefined) {
    return [];
  }
  const [start, end] = unref(range);
  if (!!start && !!end) {
    const between = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      between.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return between;
  } else {
    return range.value;
  }
}

function isToday(date: any) {
  const today = new Date(Date.now());
  today.setHours(0, 0, 0, 0);
  return today.getTime() == date.getTime();
}

function save() {
  model.value = range.value;
  menu.value = false;
}

function cancel() {
  range.value = model.value || [];
  menu.value = false;
}
</script>
<template>
  <div>
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      close-on-click
      transition="scale-transition"
      offset-y
    >
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" variant="flat" :text="dateRangeText">
          <template #append>
            <v-icon color="white"> mdi-calendar-blank </v-icon>
          </template>
        </v-btn>
      </template>

      <v-date-picker
        hide-header
        v-model="dates"
        class="datePicker mt-4"
        show-adjacent-months
        show-current
        scrollable
        rounded
        elevation="5"
        :max="new Date()"
      >
        <template #actions>
          <v-btn color="primary" variant="text" @click="cancel" text="Cancel" />
          <v-btn color="primary" variant="text" @click="save" text="OK" />
        </template>
      </v-date-picker>
    </v-menu>
  </div>
</template>
 