<script setup lang="ts">
import { ref } from 'vue';
import { useDisplay } from 'vuetify';
import Left from '@/components/layouts/left/index.vue';
import Top from '@/components/layouts/top/index.vue';

const { mobile } = useDisplay();
const menuOpen = ref(!mobile.value);
</script>

<template>
  <v-app>
    <v-layout class="main-layout-wrapper">
      <Left v-model="menuOpen" />
      <Top @toggle-menu="menuOpen = !menuOpen" />
      <v-main>
        <v-container fluid class="main-container">
          <slot />
        </v-container>
      </v-main>
      <v-footer app class="footer">
        <span>{{ new Date().getFullYear() }} © RGSInvocing.</span>
      </v-footer>
    </v-layout>
  </v-app>
</template>
