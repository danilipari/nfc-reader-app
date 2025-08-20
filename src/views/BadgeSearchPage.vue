<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Ricerca Badge</ion-title>
        <MaterialButton 
          slot="start" 
          variant="text"
          @click="goBack"
          class="back-button"
        >
          <ion-icon :icon="arrowBack"></ion-icon>
        </MaterialButton>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="container">
        <MaterialCard class="main-card">
          <div class="card-content">
            <MaterialButton 
              v-if="!operatorData"
              @click="startScanning" 
              variant="filled"
              :disabled="isScanning || isLoading"
              class="scan-button"
            >
              <ion-icon :icon="search" slot="start"></ion-icon>
              {{ isScanning ? 'Scansione in corso...' : 'Scansiona Tag' }}
            </MaterialButton>

            <div v-if="scannedTag && !operatorData && !errorMessage" class="tag-info">
              <MaterialCard class="tag-card">
                <div class="tag-content">
                  <h3>Tag Rilevato</h3>
                  <p><strong>Seriale:</strong> {{ scannedTag }}</p>
                  <ion-spinner v-if="isLoading" name="crescent" color="primary"></ion-spinner>
                  <p v-if="isLoading" class="loading-text">Ricerca in corso...</p>
                </div>
              </MaterialCard>
            </div>

            <div v-if="operatorData" class="operator-data">
              <MaterialCard class="success-card">
                <div class="card-header">
                  <h3 class="success-title">
                    <ion-icon :icon="checkmarkCircle"></ion-icon>
                    Badge Trovato
                  </h3>
                </div>
                <div class="card-content">
                  <div class="response-container">
                    <pre>{{ JSON.stringify(operatorData, null, 2) }}</pre>
                  </div>
                  
                  <MaterialButton 
                    @click="startScanning" 
                    variant="outlined"
                    class="new-search-button"
                  >
                    <ion-icon :icon="refresh" slot="start"></ion-icon>
                    Nuova Ricerca
                  </MaterialButton>
                </div>
              </MaterialCard>
            </div>

            <div v-if="errorMessage" class="error-section">
              <MaterialCard class="error-card">
                <div class="card-header">
                  <h3 class="error-title">
                    <ion-icon :icon="alertCircle"></ion-icon>
                    Errore nella Ricerca
                  </h3>
                </div>
                <div class="card-content">
                  <p><strong>Tag:</strong> {{ scannedTag }}</p>
                  <p><strong>Errore:</strong> {{ errorMessage }}</p>
                  
                  <div class="error-actions">
                    <MaterialButton 
                      @click="retrySearch" 
                      variant="filled"
                      :disabled="isLoading"
                      class="retry-button"
                    >
                      <ion-icon :icon="reload" slot="start"></ion-icon>
                      {{ isLoading ? 'Riprovando...' : 'Riprova' }}
                    </MaterialButton>
                    
                    <MaterialButton 
                      @click="resetSearch" 
                      variant="outlined"
                      class="reset-button"
                    >
                      <ion-icon :icon="refresh" slot="start"></ion-icon>
                      Reset
                    </MaterialButton>
                  </div>
                </div>
              </MaterialCard>
            </div>
          </div>
        </MaterialCard>
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
  IonIcon,
  IonSpinner,
  toastController
} from '@ionic/vue';
import { search, arrowBack, refresh, reload, checkmarkCircle, alertCircle } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { nfcService } from '@/services/nfcService';
import { apiService } from '@/services/apiService';
import MaterialCard from '@/components/MaterialCard.vue';
import MaterialButton from '@/components/MaterialButton.vue';

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
/* Material 3 Design System Variables */
:root {
  --md-sys-color-primary: #6750a4;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #eaddff;
  --md-sys-color-on-primary-container: #21005d;
  --md-sys-color-surface: #fef7ff;
  --md-sys-color-on-surface: #1d1b20;
  --md-sys-color-surface-variant: #e7e0ec;
  --md-sys-color-on-surface-variant: #49454f;
  --md-sys-color-outline: #79747e;
  --md-sys-color-success: #4caf50;
  --md-sys-color-error: #f44336;
  --md-ref-elevation-level1: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
  --md-ref-elevation-level2: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15);
}

@media (prefers-color-scheme: dark) {
  :root {
    --md-sys-color-primary: #d0bcff;
    --md-sys-color-on-primary: #381e72;
    --md-sys-color-primary-container: #4f378b;
    --md-sys-color-on-primary-container: #eaddff;
    --md-sys-color-surface: #141218;
    --md-sys-color-on-surface: #e6e0e9;
    --md-sys-color-surface-variant: #49454f;
    --md-sys-color-on-surface-variant: #cac4d0;
    --md-sys-color-outline: #938f99;
  }
}

#container {
  padding: 24px 16px;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--md-sys-color-surface) 0%, color-mix(in srgb, var(--md-sys-color-primary-container) 10%, var(--md-sys-color-surface)) 100%);
}

/* Material Card Styles */
.main-card {
  max-width: 600px;
  margin: 0 auto;
  animation: slideIn 0.4s ease-out;
}

.card-header {
  text-align: center;
  padding: 32px 24px 24px;
  background: linear-gradient(135deg, var(--md-sys-color-primary-container), color-mix(in srgb, var(--md-sys-color-primary-container) 80%, transparent));
  border-radius: 28px 28px 0 0;
  margin: -24px -24px 24px -24px;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: var(--md-sys-color-on-primary-container);
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 16px;
  color: color-mix(in srgb, var(--md-sys-color-on-primary-container) 80%, transparent);
  margin: 0;
  line-height: 1.4;
}

.card-content {
  padding: 0;
}

/* Button Styles */
.scan-button,
.new-search-button {
  width: 100%;
  margin: 16px 0;
  height: 48px;
  border-radius: 24px;
  font-weight: 500;
  font-size: 16px;
  letter-spacing: 0.1px;
}

.back-button {
  border-radius: 20px !important;
  --ripple-color: var(--md-sys-color-primary);
}

/* Status Cards */
.tag-info,
.operator-data,
.error-section {
  margin: 24px 0;
}

.tag-card {
  background: var(--md-sys-color-primary-container);
  border: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 20%, transparent);
  animation: slideIn 0.3s ease-out;
}

.tag-content {
  padding: 24px;
  text-align: center;
}

.tag-content h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--md-sys-color-on-primary-container);
  margin: 0 0 12px 0;
}

.tag-content p {
  font-size: 16px;
  color: var(--md-sys-color-on-primary-container);
  margin: 8px 0;
}

.loading-text {
  font-style: italic;
  opacity: 0.8;
  animation: pulse 1.5s infinite;
}

/* Success Card */
.success-card {
  background: linear-gradient(135deg, #e8f5e8, #f1f8e9);
  border: 1px solid var(--md-sys-color-success);
  animation: slideIn 0.3s ease-out;
}

.success-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: var(--md-sys-color-success);
  margin: 0;
}

.success-title ion-icon {
  font-size: 24px;
}

/* Error Card */
.error-card {
  background: linear-gradient(135deg, #ffebee, #ffcdd2);
  border: 1px solid var(--md-sys-color-error);
  animation: slideIn 0.3s ease-out;
}

.error-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: var(--md-sys-color-error);
  margin: 0;
}

.error-title ion-icon {
  font-size: 24px;
}

.success-card .card-header,
.error-card .card-header {
  padding: 20px 24px;
  margin: -24px -24px 20px -24px;
  border-radius: 28px 28px 0 0;
}

.success-card .card-content,
.error-card .card-content {
  padding: 0 24px 24px;
}

.error-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.retry-button,
.reset-button {
  flex: 1;
  height: 44px;
  border-radius: 22px;
}

/* Response Container */
.response-container {
  background: linear-gradient(135deg, #1e1e1e, #2d2d2d);
  border-radius: 16px;
  padding: 20px;
  margin: 16px 0;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid color-mix(in srgb, var(--md-sys-color-outline) 30%, transparent);
  box-shadow: var(--md-ref-elevation-level1);
}

.response-container pre {
  color: #e0e0e0;
  font-size: 13px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.5;
}

/* Spinner Styling */
ion-spinner {
  margin: 16px 0;
  --color: var(--md-sys-color-primary);
}

/* Animations */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

/* Enhanced Hover Effects */
.tag-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--md-ref-elevation-level2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.success-card:hover,
.error-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--md-ref-elevation-level2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .main-card,
  .tag-card,
  .success-card,
  .error-card {
    animation: none;
  }
  
  .loading-text {
    animation: none;
  }
  
  .tag-card:hover,
  .success-card:hover,
  .error-card:hover {
    transform: none;
    transition: none;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  #container {
    padding: 16px 12px;
  }
  
  .card-header {
    padding: 24px 16px 20px;
    margin: -20px -20px 20px -20px;
  }
  
  .title {
    font-size: 24px;
  }
  
  .subtitle {
    font-size: 14px;
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .retry-button,
  .reset-button {
    width: 100%;
  }
}

/* Hide old ionic card styles when using material cards */
.tag-info ion-card,
.operator-data ion-card,
.error-section ion-card {
  display: none;
}
</style>
