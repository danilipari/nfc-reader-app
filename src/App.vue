<template>
  <ion-app>
    <SplashScreen 
      v-if="showSplash" 
      :duration="3500"
      :show-progress="true"
      @complete="hideSplash"
    />
    <ion-router-outlet v-else />
  </ion-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { SplashScreen } from '@/components';

const showSplash = ref(true);

const hideSplash = () => {
  showSplash.value = false;
};

onMounted(() => {
  showSplash.value = true;
});
</script>
