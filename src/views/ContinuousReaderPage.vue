<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Modalità Monitor</ion-title>
        <MaterialButton 
          slot="start" 
          variant="text"
          @click="goBack"
          class="back-button"
        >
          <template #icon>
            <ion-icon :icon="arrowBack"></ion-icon>
          </template>
        </MaterialButton>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="container">
        <MaterialCard class="main-card">
          <div class="card-content">
            <MaterialButton 
              @click="toggleContinuousMode" 
              :variant="continuousMode ? 'outlined' : 'filled'"
              :disabled="isProcessing"
              class="monitor-button"
              :class="{ 'monitor-active': continuousMode }"
            >
              <template #icon>
                <ion-icon :icon="continuousMode ? stopCircle : scan"></ion-icon>
              </template>
              {{ continuousMode ? 'Interrompi Monitor' : 'Avvia Monitor' }}
            </MaterialButton>

            <div v-if="currentScannedTag" class="scanned-tag-section">
              <MaterialCard class="tag-card">
                <div class="tag-content">
                  <h3>Tag Rilevato</h3>
                  <p><strong>Seriale:</strong> {{ currentScannedTag }}</p>
                  
                  <MaterialButton 
                    @click="sendToAPI" 
                    variant="filled"
                    :disabled="isProcessing || !continuousMode"
                    class="sync-button"
                  >
                    <template #icon>
                      <ion-icon :icon="send"></ion-icon>
                    </template>
                    {{ isProcessing ? 'Sincronizzazione...' : 'Sincronizza' }}
                  </MaterialButton>
                </div>
              </MaterialCard>
            </div>

            <div v-if="apiResult" class="api-result-section">
              <MaterialCard :class="apiResult.success ? 'success-card' : 'error-card'">
                <div class="result-content">
                  <h3 :class="apiResult.success ? 'success-title' : 'error-title'">
                    {{ apiResult.success ? '✅ Sincronizzato' : '❌ Sincronizzazione Fallita' }}
                  </h3>
                  <p v-if="apiResult.timestamp" class="timestamp">
                    {{ new Date(apiResult.timestamp).toLocaleTimeString() }}
                  </p>
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
  toastController
} from '@ionic/vue';
import { scan, send, arrowBack, stopCircle } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { nfcService } from '@/services/nfcService';
import { apiService } from '@/services/apiService';
import MaterialCard from '@/components/MaterialCard.vue';
import MaterialButton from '@/components/MaterialButton.vue';

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
  --md-sys-color-warning: #ff9800;
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

/* Monitor Button Styles */
.monitor-button {
  width: 100%;
  margin: 16px 0 24px 0;
  height: 56px;
  border-radius: 28px;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.1px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.monitor-button.monitor-active {
  background: linear-gradient(135deg, var(--md-sys-color-error), #d32f2f);
  color: white;
  border-color: var(--md-sys-color-error);
  animation: pulse 2s infinite;
}

.back-button {
  border-radius: 20px !important;
  --ripple-color: var(--md-sys-color-primary);
}

/* Status Cards */
.scanned-tag-section,
.api-result-section {
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
  margin: 8px 0 20px 0;
}

.sync-button {
  width: 100%;
  height: 48px;
  border-radius: 24px;
  font-weight: 500;
  font-size: 16px;
  background: var(--md-sys-color-success);
  color: white;
}

/* Result Cards */
.success-card {
  background: linear-gradient(135deg, #e8f5e8, #f1f8e9);
  border: 1px solid var(--md-sys-color-success);
  animation: slideIn 0.3s ease-out;
}

.error-card {
  background: linear-gradient(135deg, #ffebee, #ffcdd2);
  border: 1px solid var(--md-sys-color-error);
  animation: slideIn 0.3s ease-out;
}

.result-content {
  padding: 24px;
  text-align: center;
}

.success-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--md-sys-color-success);
  margin: 0 0 12px 0;
}

.error-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--md-sys-color-error);
  margin: 0 0 12px 0;
}

.timestamp {
  font-size: 14px;
  opacity: 0.7;
  margin: 8px 0 0 0;
  font-style: italic;
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
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(244, 67, 54, 0);
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

.monitor-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--md-ref-elevation-level2);
}

.sync-button:hover:not(:disabled) {
  background: #43a047;
  transform: translateY(-1px);
}

/* Active State Animations */
.monitor-button:active:not(:disabled) {
  transform: scale(0.98);
}

.sync-button:active:not(:disabled) {
  transform: scale(0.98);
}

/* Status Indicators */
.monitor-button.monitor-active::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, var(--md-sys-color-error), var(--md-sys-color-warning));
  border-radius: 30px;
  z-index: -1;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .main-card,
  .tag-card,
  .success-card,
  .error-card {
    animation: none;
  }
  
  .monitor-button.monitor-active {
    animation: none;
  }
  
  .monitor-button.monitor-active::before {
    animation: none;
  }
  
  .tag-card:hover,
  .success-card:hover,
  .error-card:hover,
  .monitor-button:hover,
  .sync-button:hover {
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
  
  .monitor-button {
    height: 52px;
    font-size: 15px;
  }
  
  .sync-button {
    height: 44px;
    font-size: 15px;
  }
}

/* Hide old ionic styles */
.scanned-tag-section ion-card,
.api-result-section ion-card {
  display: none;
}
</style>
