<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Ricerca Badge</ion-title>
        <ion-button slot="start" fill="clear" @click="goBack">
          <ion-icon :icon="arrowBack"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Ricerca Badge</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Ricerca Badge</ion-card-title>
            <ion-card-subtitle>Scansiona un badge per visualizzare i dati del personale</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-button 
              v-if="!operatorData"
              @click="startScanning" 
              expand="block" 
              :disabled="isScanning || isLoading"
              color="primary"
            >
              <ion-icon :icon="search" slot="start"></ion-icon>
              {{ isScanning ? 'Scansione in corso...' : 'Scansiona Tag' }}
            </ion-button>

            <div v-if="scannedTag && !operatorData && !errorMessage" class="tag-info">
              <ion-card color="light">
                <ion-card-content>
                  <ion-text>
                    <h3>Tag Rilevato</h3>
                    <p><strong>Seriale:</strong> {{ scannedTag }}</p>
                  </ion-text>
                  <ion-spinner v-if="isLoading" name="crescent" color="primary"></ion-spinner>
                  <p v-if="isLoading" style="margin-top: 10px;">Ricerca in corso...</p>
                </ion-card-content>
              </ion-card>
            </div>

            <div v-if="operatorData" class="operator-data">
              <ion-card color="success">
                <ion-card-header>
                  <ion-card-title>
                    <ion-icon :icon="checkmarkCircle" style="margin-right: 8px;"></ion-icon>
                    Badge Trovato
                  </ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <div class="response-container">
                    <pre>{{ JSON.stringify(operatorData, null, 2) }}</pre>
                  </div>
                  
                  <ion-button 
                    @click="startScanning" 
                    expand="block" 
                    fill="outline"
                    color="primary"
                    style="margin-top: 15px;"
                  >
                    <ion-icon :icon="refresh" slot="start"></ion-icon>
                    Nuova Ricerca
                  </ion-button>
                </ion-card-content>
              </ion-card>
            </div>

            <div v-if="errorMessage" class="error-section">
              <ion-card color="danger">
                <ion-card-header>
                  <ion-card-title>
                    <ion-icon :icon="alertCircle" style="margin-right: 8px;"></ion-icon>
                    Errore nella Ricerca
                  </ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-text color="light">
                    <p><strong>Tag:</strong> {{ scannedTag }}</p>
                    <p><strong>Errore:</strong> {{ errorMessage }}</p>
                  </ion-text>
                  
                  <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <ion-button 
                      @click="retrySearch" 
                      expand="block" 
                      fill="solid"
                      color="warning"
                      style="flex: 1;"
                      :disabled="isLoading"
                    >
                      <ion-icon :icon="reload" slot="start"></ion-icon>
                      {{ isLoading ? 'Riprovando...' : 'Riprova' }}
                    </ion-button>
                    
                    <ion-button 
                      @click="resetSearch" 
                      expand="block" 
                      fill="outline"
                      color="light"
                      style="flex: 1;"
                    >
                      <ion-icon :icon="refresh" slot="start"></ion-icon>
                      Reset
                    </ion-button>
                  </div>
                </ion-card-content>
              </ion-card>
            </div>

            <div v-if="false" class="history-section"> <!-- searchHistory.length > 0 -->
              <ion-text color="medium">
                <h4>Ricerche Recenti</h4>
              </ion-text>
              
              <ion-list>
                <ion-item 
                  v-for="(item, index) in searchHistory.slice().reverse().slice(0, 5)" 
                  :key="index"
                  @click="viewHistoryItem(item)"
                  button
                >
                  <ion-label>
                    <h3>{{ item.tag }}</h3>
                    <p>{{ new Date(item.timestamp).toLocaleTimeString() }}</p>
                  </ion-label>
                  <ion-badge 
                    :color="item.success ? 'success' : 'danger'" 
                    slot="end"
                  >
                    {{ item.success ? 'Trovato' : 'Non trovato' }}
                  </ion-badge>
                </ion-item>
              </ion-list>
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
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  toastController
} from '@ionic/vue';
import { search, arrowBack, refresh, reload, checkmarkCircle, alertCircle } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { nfcService } from '@/services/nfcService';
import { apiService } from '@/services/apiService';

interface SearchHistoryItem {
  tag: string;
  timestamp: number;
  success: boolean;
  data?: any;
  error?: string;
}

const router = useRouter();

const isScanning = ref(false);
const isLoading = ref(false);
const scannedTag = ref<string | null>(null);
const operatorData = ref<any>(null);
const errorMessage = ref<string | null>(null);
const searchHistory = ref<SearchHistoryItem[]>([]);

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
  router.push('/home');
};

const searchBadge = async (tag: string) => {
  isLoading.value = true;
  errorMessage.value = null;
  operatorData.value = null;
  
  try {
    const response = await apiService.searchBySerial(tag);
    
    if (response.success) {
      operatorData.value = response.data;
      
      searchHistory.value.push({
        tag,
        timestamp: Date.now(),
        success: true,
        data: response.data
      });
      
      showToast('Badge trovato', 'success');
    } else {
      errorMessage.value = response.error || 'Badge non trovato';
      
      searchHistory.value.push({
        tag,
        timestamp: Date.now(),
        success: false,
        error: response.error
      });
      
      showToast(`Errore: ${response.error}`, 'danger');
    }
  } catch (error) {
    const err = error instanceof Error ? error.message : 'Errore sconosciuto';
    errorMessage.value = err;
    
    searchHistory.value.push({
      tag,
      timestamp: Date.now(),
      success: false,
      error: err
    });
    
    showToast(`Errore: ${err}`, 'danger');
  } finally {
    isLoading.value = false;
  }
};

const startScanning = async () => {
  resetSearch();
  
  isScanning.value = true;
  
  const isSupported = await nfcService.isSupported();
  if (!isSupported) {
    showToast('NFC non supportato su questo dispositivo', 'warning');
    isScanning.value = false;
    return;
  }
  
  const listenersSetup = await nfcService.setupListeners(
    async (data) => {
      if (!isScanning.value) return;
      
      scannedTag.value = data.serial;
      showToast(`Tag rilevato: ${data.serial}`, 'success');
      
      // Non fermare isScanning qui, lascia che searchOperator lo gestisca
      await searchBadge(data.serial);
      
      // Ferma la scansione solo dopo aver ricevuto la risposta
      isScanning.value = false;
    },
    (error) => {
      showToast(error, 'danger');
      // Non fermare la scansione su errore generico, continua
    }
  );
  
  if (!listenersSetup) {
    showToast('Errore nell\'inizializzazione NFC', 'danger');
    isScanning.value = false;
    return;
  }
  
  await nfcService.startScan();
  
  showToast('Avvicina un tag NFC al dispositivo', 'primary');
  
  // Nessun timeout - la scansione continua finché non trova qualcosa
};

const retrySearch = async () => {
  if (scannedTag.value) {
    await searchBadge(scannedTag.value);
  }
};

const resetSearch = () => {
  scannedTag.value = null;
  operatorData.value = null;
  errorMessage.value = null;
  isLoading.value = false;
  // Non fermare isScanning qui, viene gestito da startScanning
};

const viewHistoryItem = (item: SearchHistoryItem) => {
  scannedTag.value = item.tag;
  if (item.success && item.data) {
    operatorData.value = item.data;
    errorMessage.value = null;
  } else {
    operatorData.value = null;
    errorMessage.value = item.error || 'Errore sconosciuto';
  }
};

onMounted(async () => {
  const isSupported = await nfcService.isSupported();
  if (!isSupported) {
    showToast('NFC non disponibile', 'warning');
  }
});

onUnmounted(async () => {
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

.tag-info {
  margin: 20px 0;
}

.operator-data {
  margin: 20px 0;
}

.error-section {
  margin: 20px 0;
}

.history-section {
  margin-top: 30px;
}

.response-container {
  background: #1e1e1e;
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
  max-height: 400px;
  overflow-y: auto;
  text-align: left;
}

.response-container pre {
  color: #d4d4d4;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.tag-info ion-card,
.operator-data ion-card,
.error-section ion-card {
  margin: 0;
}
</style>