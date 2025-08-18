<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Modalità Monitor</ion-title>
        <ion-button slot="start" fill="clear" @click="goBack">
          <ion-icon :icon="arrowBack"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Modalità Monitor</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Monitor Tag NFC</ion-card-title>
            <ion-card-subtitle>Scansione e sincronizzazione in tempo reale</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-button 
              @click="toggleContinuousMode" 
              expand="block" 
              :color="continuousMode ? 'danger' : 'primary'"
              :disabled="isProcessing"
              style="margin-bottom: 20px;"
            >
              <ion-icon :icon="continuousMode ? stopCircle : scan" slot="start"></ion-icon>
              {{ continuousMode ? 'Interrompi Monitor' : 'Avvia Monitor' }}
            </ion-button>

            <div v-if="currentScannedTag" class="scanned-tag-section">
              <ion-card color="light">
                <ion-card-content>
                  <ion-text>
                    <h3>Tag Rilevato</h3>
                    <p><strong>Seriale:</strong> {{ currentScannedTag }}</p>
                  </ion-text>
                  
                  <ion-button 
                    @click="sendToAPI" 
                    expand="block" 
                    color="success"
                    :disabled="isProcessing || !continuousMode"
                    style="margin-top: 15px;"
                  >
                    <ion-icon :icon="send" slot="start"></ion-icon>
                    {{ isProcessing ? 'Sincronizzazione...' : 'Sincronizza' }}
                  </ion-button>
                </ion-card-content>
              </ion-card>
            </div>

            <div v-if="apiResult" class="api-result-section">
              <ion-card :color="apiResult.success ? 'success' : 'danger'">
                <ion-card-content>
                  <ion-text :color="apiResult.success ? 'light' : 'light'">
                    <h3>{{ apiResult.success ? '✅ Sincronizzato' : '❌ Sincronizzazione Fallita' }}</h3>
                    <!-- <p>{{ apiResult.message }}</p> -->
                    <p v-if="apiResult.timestamp" style="font-size: 0.9em; opacity: 0.8;">
                      {{ new Date(apiResult.timestamp).toLocaleTimeString() }}
                    </p>
                  </ion-text>
                </ion-card-content>
              </ion-card>
            </div>

          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonText,
  toastController
} from '@ionic/vue';
import { scan, send, arrowBack, stopCircle } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { nfcService } from '@/services/nfcService';
import { apiService } from '@/services/apiService';

const router = useRouter();

const continuousMode = ref(false);
const currentScannedTag = ref<string | null>(null);
const isProcessing = ref(false);
const apiResult = ref<{ success: boolean; message: string; timestamp?: number } | null>(null);

const showToast = async (message: string, color: string = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    position: 'bottom',
    color
  });
  await toast.present();
};

const goBack = () => {
  if (continuousMode.value) {
    toggleContinuousMode();
  }
  router.push('/home');
};

const checkNFCStatus = async () => {
  const supported = await nfcService.isSupported();
  if (!supported) {
    showToast('NFC non è supportato su questo dispositivo.', 'warning');
  }
  return supported;
};

const setupNFCListeners = async () => {
  const success = await nfcService.setupListeners(
    (data) => {
      if (!continuousMode.value || isProcessing.value) {
        return;
      }
      currentScannedTag.value = data.serial;
      apiResult.value = null;
      showToast(`Tag rilevato: ${data.serial}`, 'success');
    },
    (error) => {
      showToast(error, 'danger');
    }
  );
  
  return success;
};

const toggleContinuousMode = async () => {
  if (!continuousMode.value) {
    const isSupported = await checkNFCStatus();
    if (!isSupported) {
      return;
    }
    
    const listenersSetup = await setupNFCListeners();
    if (!listenersSetup) {
      showToast('Errore nell\'inizializzazione NFC', 'danger');
      return;
    }
    
    await nfcService.startScan();
    
    continuousMode.value = true;
    currentScannedTag.value = null;
    apiResult.value = null;
    showToast('Modalità lettura costante attivata', 'primary');
  } else {
    continuousMode.value = false;
    currentScannedTag.value = null;
    apiResult.value = null;
    showToast('Modalità lettura costante disattivata', 'medium');
  }
};

const sendToAPI = async () => {
  if (!currentScannedTag.value || isProcessing.value) {
    return;
  }
  
  isProcessing.value = true;
  
  try {
    const response = await apiService.sendTagToAPI(currentScannedTag.value);
    
    if (response.success) {
      apiResult.value = {
        success: true,
        message: `Successo! Status: ${response.status}`,
        timestamp: Date.now()
      };
      
      showToast('Tag inviato con successo!', 'success');
    } else {
      apiResult.value = {
        success: false,
        message: response.error || 'Errore sconosciuto',
        timestamp: Date.now()
      };
      
      showToast(`Errore: ${response.error}`, 'danger');
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    
    apiResult.value = {
      success: false,
      message: errorMessage,
      timestamp: Date.now()
    };
    
    showToast(`Errore: ${errorMessage}`, 'danger');
  } finally {
    isProcessing.value = false;
    
    setTimeout(() => {
      currentScannedTag.value = null;
      apiResult.value = null;
    }, 1_000);
  }
};

onMounted(async () => {
  await checkNFCStatus();
});

onUnmounted(async () => {
  if (continuousMode.value) {
    continuousMode.value = false;
  }
  
  await nfcService.removeListeners();
});
</script>

<style scoped>
#container {
  text-align: center;
  padding: 20px;
}

ion-card {
  max-width: 600px;
  margin: 20px auto;
}

.status-section {
  margin: 20px 0;
  padding: 15px;
  background-color: var(--ion-color-primary-tint);
  border-radius: 8px;
  border: 2px solid var(--ion-color-primary);
}

.scanned-tag-section {
  margin: 20px 0;
}

.api-result-section {
  margin: 20px 0;
}

.scanned-tag-section ion-card {
  margin: 0;
}

.api-result-section ion-card {
  margin: 0;
}
</style>