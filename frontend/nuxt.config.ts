import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import pck from "./package.json";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },

  experimental: {
    // Avoid missing dev manifests; retain production build update detection.
    appManifest: process.env.NODE_ENV === "production",
  },

  app: {
    head: {
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
        },
      ],
    },
  },

  css: ["@/assets/css/theme.css"],

  runtimeConfig: {
    public: {
      baseURL: process.env.API_URL || "https://api.example.com/",
      appName: process.env.APP_NAME,
      version: pck.version,
    },
  },

  build: {
    transpile: ["vuetify"],
  },

  ssr: false,

  plugins: [{ src: "~/plugins/datepicker.ts", mode: "client" }],

  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
    "@pinia/nuxt",
    "@pinia-plugin-persistedstate/nuxt",
  ],
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
});
