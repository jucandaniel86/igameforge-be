import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import { createVuetify } from "vuetify";

export default defineNuxtPlugin((app) => {
  app.vueApp.use(
    createVuetify({
      theme: { defaultTheme: "light" },
      defaults: {
        VBtn: { elevation: 0, rounded: "lg" },
        VCard: { elevation: 0, rounded: "lg" },
        VTextField: { variant: "outlined", density: "comfortable", color: "primary" },
        VSelect: {
          variant: "solo",
          flat: true,
          density: "comfortable",
          color: "primary",
          menuIcon: "mdi-chevron-down",
          clearIcon: "mdi-close",
          menuProps: { offset: 6 },
        },
        VAutocomplete: {
          variant: "solo",
          flat: true,
          density: "comfortable",
          color: "primary",
          menuIcon: "mdi-chevron-down",
          clearIcon: "mdi-close",
          menuProps: { offset: 6 },
        },
        VCombobox: {
          variant: "outlined",
          density: "comfortable",
          color: "primary",
          menuIcon: "mdi-chevron-down",
          clearIcon: "mdi-close",
          menuProps: { offset: 6 },
        },
        VTextarea: { variant: "outlined", density: "comfortable", color: "primary" },
        VDataTable: { density: "comfortable" },
        VTooltip: { location: "top" },
      },
    }),
  );
});
