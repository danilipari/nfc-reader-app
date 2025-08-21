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
          <template #icon>
            <ion-icon :icon="arrowBack"></ion-icon>
          </template>
        </MaterialButton>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="minimal-container">
        <div v-if="!operatorData && !errorMessage && !isLoading" class="scan-section">
          <div class="scan-prompt">
            <ion-icon :icon="searchOutline" class="scan-icon"></ion-icon>
            <h2>Scansiona un Badge</h2>
            <p>Avvicina il badge al lettore NFC per iniziare</p>
          </div>
          
          <button 
            @click="startScanning" 
            :disabled="isScanning"
            class="minimal-scan-button"
            :class="{ 'scanning': isScanning }"
          >
            <ion-icon :icon="scan" v-if="!isScanning"></ion-icon>
            <ion-spinner name="crescent" v-else></ion-spinner>
            <span>{{ isScanning ? 'Scansione in corso...' : 'Scansiona Badge' }}</span>
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading && scannedTag" class="loading-section">
          <div class="loading-content">
            <ion-spinner name="crescent" class="large-spinner"></ion-spinner>
            <p class="loading-text">Ricerca badge {{ scannedTag }}</p>
          </div>
        </div>

        <!-- Success State - Operator Data -->
        <div v-if="operatorData" class="result-section">
          
          <!-- Profile Header -->
          <div class="profile-header">
            <div class="avatar-large">
              <img 
                v-if="operatorData?.entity?.photo" 
                :src="operatorData.entity.photo"
                :alt="`${operatorData?.first_name} ${operatorData?.last_name}`"
                @error="handleImageError"
              />
              <div v-else class="avatar-placeholder">
                {{ getInitials(operatorData?.first_name, operatorData?.last_name) }}
              </div>
            </div>
            
            <h1 class="operator-name">{{ operatorData?.first_name }} {{ operatorData?.last_name }}</h1>
            <p class="operator-email">{{ operatorData?.email }}</p>
            
            <div class="id-row">
              <span class="id-chip">Operator: {{ operatorData?.entity?.operator_id }}</span>
              <span class="id-chip">Employee: {{ operatorData?.ext_user_id }}</span>
            </div>
          </div>

          <!-- Data Grid -->
          <div class="data-grid">
            
            <div class="data-row">
              <div class="data-label">
                <ion-icon :icon="fingerPrint"></ion-icon>
                <span>Badge Serial</span>
              </div>
              <div class="data-value">{{ operatorData?.serial_number }}</div>
            </div>
            
            <div v-if="operatorData?.locks && operatorData.locks.length > 0" class="data-row">
              <div class="data-label">
                <ion-icon :icon="lockClosed"></ion-icon>
                <span>Accessi</span>
              </div>
              <div class="data-value">
                <div class="access-list">
                  <span v-for="lock in operatorData.locks" :key="lock" class="access-item">
                    {{ lock }}
                  </span>
                </div>
              </div>
            </div>
            
            <div v-if="operatorData?.entity?.created_at" class="data-row">
              <div class="data-label">
                <ion-icon :icon="calendarOutline"></ion-icon>
                <span>Creato il</span>
              </div>
              <div class="data-value">{{ formatDate(operatorData.entity.created_at) }}</div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-row">
            <button @click="startScanning" class="minimal-button secondary">
              <ion-icon :icon="refresh"></ion-icon>
              <span>Nuova Ricerca</span>
            </button>
          </div>
        </div>

        <!-- Error State -->
        <div v-if="errorMessage" class="error-section">
          <div class="error-content">
            <ion-icon :icon="alertCircleOutline" class="error-icon"></ion-icon>
            <h2>Badge non trovato</h2>
            <p class="error-detail">{{ errorMessage }}</p>
            <p class="error-tag">Tag: {{ scannedTag }}</p>
            
            <div class="error-actions">
              <button @click="retrySearch" :disabled="isLoading" class="minimal-button primary">
                <ion-icon :icon="reload"></ion-icon>
                <span>{{ isLoading ? 'Riprovando...' : 'Riprova' }}</span>
              </button>
              
              <button @click="resetSearch" class="minimal-button secondary">
                <ion-icon :icon="arrowBack"></ion-icon>
                <span>Nuova Ricerca</span>
              </button>
            </div>
          </div>
        </div>
        
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
import { searchOutline, arrowBack, refresh, reload, alertCircleOutline, fingerPrint, lockClosed, scan, calendarOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { nfcService } from '@/services/nfcService';
import { apiService } from '@/services/apiService';
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
  console.log('🔍 searchBadge called with tag:', tag);
  isLoading.value = true;
  errorMessage.value = null;
  operatorData.value = null;
  
  try {
    const response = await apiService.searchBySerial(tag);
    console.log('📡 API Response:', response);
    
    if (response.success) {
      operatorData.value = response.data.data;
      console.log('✅ operatorData set to:', operatorData.value);
      console.log('States - isLoading:', isLoading.value, 'errorMessage:', errorMessage.value);
      
      searchHistory.value.push({
        tag,
        timestamp: Date.now(),
        success: true,
        data: response.data.data
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
    console.log('🏁 Final states:', {
      operatorData: operatorData.value,
      isLoading: isLoading.value,
      errorMessage: errorMessage.value,
      scannedTag: scannedTag.value
    });
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

const getInitials = (firstName: string, lastName: string): string => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}`;
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const container = img.parentElement;
  if (container) {
    const placeholder = container.querySelector('.avatar-placeholder');
    if (placeholder) {
      (placeholder as HTMLElement).style.display = 'flex';
    }
  }
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};


onMounted(async () => {
  const isSupported = await nfcService.isSupported();
  if (!isSupported) {
    showToast('NFC non disponibile', 'warning');
  } else {
    // Avvia automaticamente la scansione all'apertura della pagina
    // await startScanning();
  }
});

onUnmounted(async () => {
  await nfcService.removeListeners();
});
</script>

<style scoped>
/* Minimal Design System */
:root {
  --primary: #6750a4;
  --primary-light: #eaddff;
  --text-primary: #1d1b20;
  --text-secondary: #49454f;
  --text-tertiary: #79747e;
  --surface: #ffffff;
  --surface-variant: #f7f3fc;
  --border: #e0e0e0;
  --success: #4caf50;
  --error: #f44336;
  --warning: #ff9800;
}

@media (prefers-color-scheme: dark) {
  :root {
    --primary: #d0bcff;
    --primary-light: #4f378b;
    --text-primary: #e6e0e9;
    --text-secondary: #cac4d0;
    --text-tertiary: #938f99;
    --surface: #141218;
    --surface-variant: #1e1b24;
    --border: #49454f;
  }
}

.minimal-container {
  min-height: calc(100vh - 56px); /* Account for header */
  background: var(--surface);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Scan Section */
.scan-section {
  width: 100%;
  max-width: 400px;
  padding: 40px 20px;
  text-align: center;
}

.scan-prompt {
  margin-bottom: 40px;
}

.scan-icon {
  font-size: 64px;
  color: var(--ion-color-primary, var(--primary));
  margin-bottom: 24px;
  opacity: 0.9;
}

.scan-prompt h2 {
  font-size: 28px;
  font-weight: 300;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.scan-prompt p {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
}

.minimal-scan-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
  padding: 16px 24px;
  background: var(--ion-color-primary, var(--primary));
  color: var(--ion-color-primary-contrast, white);
  border: none;
  border-radius: 100px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  -webkit-tap-highlight-color: transparent;
}

.minimal-scan-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(103, 80, 164, 0.3);
}

.minimal-scan-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.minimal-scan-button.scanning {
  background: var(--primary-light);
  color: var(--primary);
}

.minimal-scan-button ion-icon {
  font-size: 20px;
}

.minimal-scan-button ion-spinner {
  --color: var(--ion-color-primary, var(--primary));
}

/* Loading Section */
.loading-section {
  padding: 60px 20px;
  text-align: center;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.large-spinner {
  width: 48px;
  height: 48px;
  --color: var(--primary);
}

.loading-text {
  font-size: 16px;
  color: var(--text-secondary);
  animation: fade 1.5s ease-in-out infinite;
}

/* Result Section */
.result-section {
  width: 100%;
  max-width: 600px;
  padding: 40px 20px;
}

/* Profile Header */
.profile-header {
  text-align: center;
  padding-bottom: 40px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 40px;
}

.avatar-large {
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;
  position: relative;
}

.avatar-large img,
.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  font-size: 36px;
  font-weight: 600;
  letter-spacing: 2px;
}

.operator-name {
  font-size: 32px;
  font-weight: 300;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.operator-email {
  font-size: 18px;
  color: var(--text-secondary);
  margin: 0 0 20px 0;
}

.id-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.id-chip {
  padding: 8px 16px;
  background: var(--surface-variant);
  color: var(--text-primary);
  border-radius: 100px;
  font-size: 14px;
  font-weight: 500;
}

/* Data Grid */
.data-grid {
  margin-bottom: 40px;
}

.data-row {
  display: flex;
  padding: 20px 0;
  border-bottom: 1px solid var(--border);
}

.data-row:last-child {
  border-bottom: none;
}

.data-label {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 140px;
  color: var(--text-tertiary);
  font-size: 14px;
  font-weight: 500;
}

.data-label ion-icon {
  font-size: 20px;
  color: var(--primary);
}

.data-value {
  flex: 1;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 400;
}

.access-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.access-item {
  padding: 6px 12px;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

/* Action Row */
.action-row {
  display: flex;
  gap: 16px;
  justify-content: center;
}

/* Minimal Buttons */
.minimal-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 100px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.minimal-button.primary {
  background: var(--ion-color-primary, var(--primary));
  color: var(--ion-color-primary-contrast, white);
}

.minimal-button.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(103, 80, 164, 0.3);
}

.minimal-button.secondary {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.minimal-button.secondary:hover {
  background: var(--surface-variant);
  border-color: var(--text-tertiary);
}

.minimal-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.minimal-button ion-icon {
  font-size: 18px;
}

/* Error Section */
.error-section {
  width: 100%;
  max-width: 400px;
  padding: 40px 20px;
}

.error-content {
  text-align: center;
}

.error-icon {
  font-size: 64px;
  color: var(--error);
  margin-bottom: 24px;
  opacity: 0.9;
}

.error-content h2 {
  font-size: 24px;
  font-weight: 400;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.error-detail {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
}

.error-tag {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 0 0 32px 0;
  font-family: 'SF Mono', monospace;
}

.error-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.error-actions .minimal-button {
  min-width: 200px;
}

/* Animations */
@keyframes fade {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* Responsive */
@media (max-width: 768px) {
  .minimal-container {
    padding: 20px;
  }
  
  .operator-name {
    font-size: 26px;
  }
  
  .operator-email {
    font-size: 16px;
  }
  
  .data-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .data-label {
    min-width: auto;
  }
  
  .action-row {
    flex-direction: column;
  }
  
  .minimal-button {
    width: 100%;
  }
}
</style>
