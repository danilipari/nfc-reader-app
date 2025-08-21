<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div id="container">
        <!-- Hero Section -->
        <HeroSection
          title="NFC Tag Reader"
          description="Scansiona, gestisci e monitora i tag NFC"
          :icon="debugMode ? bugOutline : undefined"
          variant="primary"
          size="compact"
          @dblclick="toggleDebugMode"
        >
          <template #actions>
            <MaterialButton 
              v-if="debugMode" 
              @click="startNFCReading" 
              variant="elevated"
              size="large"
              :disabled="isReading"
            >
              <template #icon>
                <ion-icon :icon="scan"></ion-icon>
              </template>
              Scansiona Tag
            </MaterialButton>
          </template>
        </HeroSection>

        <!-- Loading state when scanning -->
        <LoadingState 
          v-if="isReading"
          type="spinner"
          title="Scansione in corso..."
          message="Avvicina il tag NFC al dispositivo"
          variant="default"
        />
        
        <!-- Quick Actions Grid -->
        <MaterialCard v-if="!isReading && !currentTag" variant="elevated">
          <template #header>
            <h3 class="section-title">Azioni Rapide</h3>
          </template>
          
          <ActionGrid
            :actions="quickActions"
            columns="auto"
            gap="medium"
            responsive
            @action="handleQuickAction"
          />
        </MaterialCard>
        
        <!-- Tag Status Display -->
        <MaterialCard v-if="currentTag" variant="elevated">
          <!-- Success Status Display -->
          <StatusDisplay
            v-if="currentTag.sendStatus === 'sent' || currentTag.sendStatus === 'completed'"
            status="success"
            :title="currentTag.sendStatus === 'completed' ? 'Tag Completato' : 'Tag Inviato'"
            :message="`${currentTag.name || 'Senza nome'} - ID: ${currentTag.employeeId}`"
            :details="[
              { label: 'Seriale', value: currentTag.serial },
              { label: 'Ultimo aggiornamento', value: currentTag.lastUpdate ? new Date(currentTag.lastUpdate).toLocaleString() : 'N/A' }
            ]"
            variant="card"
          />
          
          <!-- Pending Status Display -->
          <StatusDisplay
            v-else-if="currentTag.sendStatus === 'pending'"
            status="info"
            title="Tag Confermato"
            :message="`${currentTag.name || 'Senza nome'} - ID: ${currentTag.employeeId}`"
            :details="[
              { label: 'Seriale', value: currentTag.serial },
              { label: 'Stato', value: 'In attesa di invio' }
            ]"
            variant="card"
          >
            <template #actions>
              <MaterialButton 
                v-if="debugMode"
                @click="callAPI" 
                variant="filled"
                size="small"
                :loading="isCallingAPI"
              >
                <template #icon>
                  <ion-icon :icon="send"></ion-icon>
                </template>
                Salva nel Sistema
              </MaterialButton>
            </template>
          </StatusDisplay>
          
          <!-- Error Display -->
          <ErrorDisplay
            v-else-if="currentTag.sendStatus === 'error'"
            type="network"
            title="Errore Invio Tag"
            :message="`${currentTag.name || 'Senza nome'} - ID: ${currentTag.employeeId}`"
            :details="`Seriale: ${currentTag.serial}`"
            :suggestions="[
              'Verifica la connessione di rete',
              'Controlla che il servizio sia attivo',
              'Riprova tra qualche secondo'
            ]"
            retryable
            dismissible
            @retry="retryAPI"
            @dismiss="() => currentTag = null"
          />
        </MaterialCard>
        
        <!-- Debug Section -->
        <MaterialCard v-if="debugMode" variant="outlined">
          <template #header>
            <h3 class="section-title">
              <ion-icon :icon="bugOutline" class="debug-icon"></ion-icon>
              Strumenti Debug
            </h3>
          </template>
          
          <ActionGrid
            :actions="debugActions"
            columns="auto"
            gap="small"
            responsive
            @action="handleDebugAction"
          />
        </MaterialCard>
        <ion-modal :is-open="showConfirmModal" @did-dismiss="cancelConfirm">
          <ion-header>
            <ion-toolbar>
              <ion-title>Conferma Tag NFC</ion-title>
              <ion-button slot="end" fill="clear" @click="cancelConfirm">
                <ion-icon :icon="close"></ion-icon>
              </ion-button>
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <div style="padding: 20px;">
              <ion-text>
                <h3>Seriale: {{ currentTag?.serial }}</h3>
                <p v-if="findExistingTag(currentTag?.serial || '')">
                  <ion-badge color="primary">Tag già presente</ion-badge>
                </p>
              </ion-text>
              
              <ion-item>
                <ion-label position="stacked">Nome Tag (opzionale)</ion-label>
                <ion-input v-model="tagForm.name" placeholder="Inserisci un nome per il tag"></ion-input>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">ID Employee</ion-label>
                <ion-input v-model="tagForm.employeeId" placeholder="Inserisci ID Employee"></ion-input>
              </ion-item>
              
              <ion-button @click="confirmTag" expand="block" color="success" style="margin-top: 20px;">
                <ion-icon :icon="checkmark" slot="start"></ion-icon>
                Conferma e Salva
              </ion-button>
            </div>
          </ion-content>
        </ion-modal>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  IonContent, 
  IonPage, 
  IonButton,
  IonIcon,
  IonText,
  IonModal,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonBadge,
  IonToolbar,
  IonTitle,
  toastController
} from '@ionic/vue';
import { send, trash, checkmark, close, scan, bugOutline, flash, searchOutline, timeOutline } from 'ionicons/icons';
import { isPlatform } from '@ionic/vue';
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { NFC } from '@exxili/capacitor-nfc';
import { StatusBar, Style } from '@capacitor/status-bar';
import { apiService } from '@/services/apiService';
import { 
  MaterialCard, 
  MaterialButton, 
  StatusDisplay, 
  LoadingState, 
  ErrorDisplay,
  HeroSection,
  ActionGrid,
} from '@/components';

interface NFCTag {
  id: string;
  serial: string;
  name?: string;
  employeeId?: string;
  timestamp: number;
  lastSent?: number;
  lastUpdate?: number;
  sendStatus?: 'pending' | 'sent' | 'error' | 'completed';
  apiResponse?: any;
}

const router = useRouter();
const STORAGE_KEY = 'nfc_tags_history';

const isReading = ref(false);
const nfcValue = ref('');
const isCallingAPI = ref(false);
const apiResponse = ref('');
const nfcEnabled = ref(false);
const nfcListenersActive = ref(false);
const showConfirmModal = ref(false);
const debugMode = ref(false);
const currentTag = ref<NFCTag | null>(null);
const tagsHistory = ref<NFCTag[]>([]);
const tagForm = ref({
  name: '',
  employeeId: ''
});

// Computed properties for action grids
const quickActions = computed(() => [
  {
    id: 'continuous-reader',
    label: 'Monitor Continuo',
    icon: flash,
    variant: 'filled' as const,
    action: () => goToContinuousReader()
  },
  {
    id: 'badge-search',
    label: 'Ricerca Badge',
    icon: searchOutline,
    variant: 'outlined' as const,
    action: () => goBadgeSearch()
  }
]);

const debugActions = computed(() => [
  {
    id: 'scan-tag',
    label: 'Scansiona Tag',
    icon: scan,
    variant: 'filled' as const,
    disabled: isReading.value,
    action: () => startNFCReading()
  },
  {
    id: 'history',
    label: `Cronologia (${tagsHistory.value.length})`,
    icon: timeOutline,
    variant: 'tonal' as const,
    disabled: tagsHistory.value.length === 0,
    action: () => router.push('/history')
  }
]);

const goToContinuousReader = () => {
  router.push('/continuous-reader');
};

const goBadgeSearch = () => {
  router.push('/badge-search');
};

const handleQuickAction = (action: any) => {
  if (action.action && typeof action.action === 'function') {
    action.action();
  }
};

const handleDebugAction = (action: any) => {
  if (action.action && typeof action.action === 'function') {
    action.action();
  }
};

const loadTagsHistory = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      tagsHistory.value = JSON.parse(saved);
    }
  } catch (error) {
    tagsHistory.value = [];
  }
};

const saveTagsHistory = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tagsHistory.value));
  } catch (error) {
    showToast('Errore nel salvare i dati', 'danger');
  }
};

const findExistingTag = (serial: string): NFCTag | null => {
  return tagsHistory.value.find(tag => tag.serial === serial) || null;
};

const generateTagId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

const checkNFCStatus = async () => {
  if (!isPlatform('capacitor')) {
    return false;
  }
  
  try {
    const { supported } = await NFC.isSupported();
    nfcEnabled.value = supported;
    if (!supported) {
      showToast('NFC non è supportato su questo dispositivo.', 'warning');
    }
    return supported;
  } catch (error) {
    showToast('Errore durante la verifica dello stato NFC', 'danger');
    return false;
  }
};

const setupNFCListeners = async () => {
  if (!isPlatform('capacitor') || nfcListenersActive.value) {
    return;
  }
  
  try {
    
    NFC.onRead((data: any) => {
      if (!isReading.value) {
        return;
      }
      
      try {
        let tagContent = '';
        if (data.string && typeof data.string === 'function') {
          const stringMessages = data.string();
          
          if (stringMessages && stringMessages.messages && Array.isArray(stringMessages.messages)) {
            for (const message of stringMessages.messages) {
              if (message.records && Array.isArray(message.records)) {
                for (const record of message.records) {
                  if (record.payload && typeof record.payload === 'string') {
                    tagContent = record.payload;
                    break;
                  }
                }
              }
              if (tagContent) break;
            }
          }
        }
        
        if (!tagContent && data.numberArray && typeof data.numberArray === 'function') {
          const numberMessages = data.numberArray();
          
          if (numberMessages && numberMessages.messages && Array.isArray(numberMessages.messages)) {
            for (const message of numberMessages.messages) {
              if (message.records && Array.isArray(message.records)) {
                for (const record of message.records) {
                  if (Array.isArray(record.payload) && record.payload.length > 0) {
                    const asciiString = (record.payload as number[])
                      .map((byte: number) => String.fromCharCode(byte))
                      .join('');
                    
                    if (asciiString.length % 2 === 0) {
                      const hexBytes = asciiString.match(/.{2}/g) || [];
                      const reversedBytes = hexBytes.reverse();
                      tagContent = reversedBytes.join(':').toUpperCase();
                    } else {
                      tagContent = (record.payload as number[])
                        .map((byte: number) => byte.toString(16).padStart(2, '0').toUpperCase())
                        .join(':');
                    }
                    break;
                  }
                }
              }
              if (tagContent) break;
            }
          }
        }
        
        if (!tagContent && data.uint8Array && typeof data.uint8Array === 'function') {
          const uint8Messages = data.uint8Array();
          
          if (uint8Messages && uint8Messages.messages && Array.isArray(uint8Messages.messages)) {
            for (const message of uint8Messages.messages) {
              if (message.records && Array.isArray(message.records)) {
                for (const record of message.records) {
                  if (record.payload instanceof Uint8Array && record.payload.length > 0) {
                    tagContent = Array.from(record.payload as Uint8Array)
                      .map((byte: number) => byte.toString(16).padStart(2, '0').toUpperCase())
                      .join(':');
                    break;
                  }
                }
              }
              if (tagContent) break;
            }
          }
        }
        
        
        if (tagContent) {
          nfcValue.value = tagContent;
          isReading.value = false;
          
          const existingTag = findExistingTag(tagContent);
          if (existingTag) {
            currentTag.value = existingTag;
            tagForm.value.name = existingTag.name || '';
            tagForm.value.employeeId = existingTag.employeeId || '';
            showToast(`Tag già presente nella cronologia: ${existingTag.name || 'Senza nome'}`, 'primary');
          } else {
            currentTag.value = {
              id: generateTagId(),
              serial: tagContent,
              timestamp: Date.now(),
              sendStatus: 'pending'
            };
            tagForm.value.name = '';
            tagForm.value.employeeId = '';
            showToast(`Nuovo tag rilevato: ${tagContent}`, 'success');
          }
          
          showConfirmModal.value = true;
        } else {
          showToast('Tag NFC rilevato ma senza dati NDEF', 'warning');
          isReading.value = false;
        }
        
      } catch (error) {
        showToast('Errore durante l\'elaborazione del tag NFC', 'danger');
        isReading.value = false;
      }
    });
    
    NFC.onError((error) => {
      showToast('Errore NFC: ' + error.error, 'danger');
      isReading.value = false;
    });
    
    nfcListenersActive.value = true;
    
  } catch (error) {
    showToast('Errore durante l\'inizializzazione NFC', 'danger');
  }
};

const initializeNFC = async () => {
  if (!isPlatform('capacitor')) {
    return;
  }
  
  try {
    await checkNFCStatus();
  } catch (error) {
    showToast('Errore durante la verifica NFC', 'danger');
  }
};

const showToast = async (message: string, color: string = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    position: 'bottom',
    color
  });
  await toast.present();
};

const startNFCReading = async () => {
  isReading.value = true;
  nfcValue.value = '';
  apiResponse.value = '';
  
  if (!isPlatform('capacitor')) {
    showToast('NFC non disponibile in modalità web', 'warning');
    isReading.value = false;
    return;
  }
  
  try {
    const isSupported = await checkNFCStatus();
    if (!isSupported) {
      isReading.value = false;
      return;
    }
    
    await setupNFCListeners();
    
    if (isPlatform('ios')) {
      await NFC.startScan();
    }
    
    showToast('Avvicina un tag NFC al dispositivo...', 'primary');
    
    setTimeout(() => {
      if (isReading.value) {
        showToast('Tempo scaduto. Riprova.', 'warning');
        isReading.value = false;
      }
    }, 15000);
    
  } catch (error) {
    showToast('Errore durante l\'avvio della lettura NFC', 'danger');
    isReading.value = false;
  }
};

const confirmTag = () => {
  if (!currentTag.value) return;
  
  const newEmployeeId = tagForm.value.employeeId.trim();
  
  if (newEmployeeId) {
    const duplicateTag = tagsHistory.value.find(tag => 
      tag.employeeId === newEmployeeId && tag.serial !== currentTag.value!.serial
    );
    
    if (duplicateTag) {
      showToast(`Employee ID ${newEmployeeId} già utilizzato per il tag ${duplicateTag.serial}`, 'danger');
      return;
    }
  }
  
  currentTag.value.name = tagForm.value.name.trim() || undefined;
  currentTag.value.employeeId = newEmployeeId || undefined;
  
  const existingIndex = tagsHistory.value.findIndex(tag => tag.serial === currentTag.value!.serial);
  if (existingIndex >= 0) {
    tagsHistory.value[existingIndex] = { ...currentTag.value };
  } else {
    tagsHistory.value.unshift(currentTag.value);
  }
  
  saveTagsHistory();
  showConfirmModal.value = false;
  showToast('Tag confermato e salvato', 'success');
};

const cancelConfirm = () => {
  showConfirmModal.value = false;
  currentTag.value = null;
  nfcValue.value = '';
  tagForm.value.name = '';
  tagForm.value.employeeId = '';
};

const callAPI = async () => {
  if (!currentTag.value) return;
  
  try {
    isCallingAPI.value = true;
    apiResponse.value = '';
    
    const response = await apiService.sendTagToAPI(currentTag.value.serial);
    
    if (response.success) {
      currentTag.value.sendStatus = 'completed';
      currentTag.value.lastSent = Date.now();
      currentTag.value.lastUpdate = Date.now();
      currentTag.value.apiResponse = response.data;
      apiResponse.value = 'Tag registrato con successo nel sistema';
      showToast('Tag registrato con successo', 'success');
      
      const tagIndex = tagsHistory.value.findIndex(tag => tag.id === currentTag.value!.id);
      if (tagIndex >= 0) {
        tagsHistory.value[tagIndex] = { ...currentTag.value };
        saveTagsHistory();
      }
    } else {
      currentTag.value.sendStatus = 'error';
      apiResponse.value = `Errore: ${response.error}`;
      showToast(`Errore: ${response.error}`, 'danger');
    }
    
  } catch (error) {
    console.error('API Call Error:', error);
    currentTag.value.sendStatus = 'error';
    apiResponse.value = `Errore: ${error instanceof Error ? error.message : 'Errore durante l\'invio dei dati'}`;
    showToast(`Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`, 'danger');
  } finally {
    isCallingAPI.value = false;
  }
};

const retryAPI = async () => {
  if (currentTag.value) {
    currentTag.value.sendStatus = 'pending';
    await callAPI();
  }
};

const toggleDebugMode = () => {
  debugMode.value = !debugMode.value;
  showToast(debugMode.value ? 'Modalità Debug Attivata - Funzioni avanzate ora visibili' : 'Modalità Debug Disattivata - UI pulita ripristinata', debugMode.value ? 'warning' : 'success');
  
  // Auto-disable debug mode after 5 minutes to prevent it staying active accidentally
  if (debugMode.value) {
    setTimeout(() => {
      if (debugMode.value) {
        debugMode.value = false;
        showToast('Modalità Debug disattivata automaticamente per sicurezza', 'medium');
      }
    }, 300000); // 5 minutes
  }
};


onMounted(async () => {
  loadTagsHistory();
  await initializeNFC();
  
  if (isPlatform('capacitor')) {
    try {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch (error) {
      console.warn('StatusBar configuration failed:', error);
    }
  }
});

onUnmounted(async () => {
  if (isPlatform('capacitor')) {
    try {
      await NFC.removeAllListeners('nfcTag');
      await NFC.removeAllListeners('nfcError');
    } catch (error) {
      showToast('Errore durante la rimozione dei listener NFC', 'danger');
    }
  }
});
</script>

<style scoped>
#container {
  --md-sys-color-surface: #fef7ff;
  --md-sys-color-on-surface: #1d1b20;
  --md-sys-color-surface-variant: #f3effa;
  --md-sys-color-outline-variant: #cac4d0;
  
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--md-sys-color-surface);
}

/* Modern card spacing and layout */
:deep(.md-card) {
  margin-bottom: 32px;
  backdrop-filter: blur(20px);
  background: color-mix(in srgb, var(--md-sys-color-surface) 95%, transparent);
  border: 1px solid var(--md-sys-color-outline-variant);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.24);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.md-card:hover) {
  transform: translateY(-2px);
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.12),
    0 2px 4px rgba(0, 0, 0, 0.24);
}

/* Enhanced section titles */
.section-title {
  margin: 0 0 20px 0;
  font-family: 'Roboto', system-ui, -apple-system, sans-serif;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
  color: var(--md-sys-color-on-surface, #1d1b20);
  display: flex;
  align-items: center;
  gap: 12px;
  letter-spacing: 0.15px;
  position: relative;
}

.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, 
    var(--md-sys-color-outline-variant) 0%, 
    transparent 100%);
  margin-left: 16px;
}

/* Enhanced card header styling */
.card-header-title {
  cursor: pointer;
  user-select: none;
  padding: 16px 0;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;
  border-radius: 12px;
}

.card-header-title:hover {
  background: rgba(103, 80, 164, 0.04);
  transform: translateX(4px);
}

.card-header-title h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 400;
  color: var(--md-sys-color-on-surface, #1d1b20);
  letter-spacing: -0.25px;
}

/* Enhanced debug styling */
.debug-icon {
  color: #ff9800;
  font-size: 20px;
  opacity: 0.9;
  filter: drop-shadow(0 2px 4px rgba(255, 152, 0, 0.3));
}

.debug-active {
  background: linear-gradient(135deg, 
    rgba(255, 152, 0, 0.08) 0%, 
    rgba(255, 152, 0, 0.04) 100%);
  padding: 12px 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 152, 0, 0.2);
  backdrop-filter: blur(10px);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4);
  }
  50% { 
    box-shadow: 0 0 0 8px rgba(255, 152, 0, 0);
  }
}

/* Modern action buttons layout */
.action-buttons {
  display: grid;
  gap: 16px;
  margin: 32px 0;
  grid-template-columns: 1fr;
}

/* Enhanced debug actions */
.debug-actions {
  margin-top: 32px;
  padding: 24px 0 0 0;
  position: relative;
}

.debug-actions::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    var(--md-sys-color-outline-variant) 20%, 
    var(--md-sys-color-outline-variant) 80%, 
    transparent 100%);
}

/* Enhanced Material components */
:deep(.md-button) {
  width: 100%;
  border-radius: 24px;
  font-weight: 500;
  letter-spacing: 0.1px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.md-status),
:deep(.md-error),
:deep(.md-loading) {
  margin: 24px 0;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

/* Enhanced loading state */
:deep(.md-loading) {
  background: linear-gradient(135deg, 
    rgba(103, 80, 164, 0.05) 0%, 
    rgba(103, 80, 164, 0.02) 100%);
  border: 1px solid rgba(103, 80, 164, 0.1);
}

/* Enhanced status display */
:deep(.md-status) {
  background: linear-gradient(135deg, 
    rgba(76, 175, 80, 0.05) 0%, 
    rgba(76, 175, 80, 0.02) 100%);
  border: 1px solid rgba(76, 175, 80, 0.1);
}

/* Enhanced error display */
:deep(.md-error) {
  background: linear-gradient(135deg, 
    rgba(244, 67, 54, 0.05) 0%, 
    rgba(244, 67, 54, 0.02) 100%);
  border: 1px solid rgba(244, 67, 54, 0.1);
}

/* Advanced responsive design */
@media (min-width: 480px) {
  #container {
    padding: 32px;
  }
  
  .action-buttons {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (min-width: 768px) {
  #container {
    padding: 48px;
  }
  
  .action-buttons {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 24px;
  }
  
  :deep(.md-button) {
    width: auto;
    min-width: 200px;
  }
  
  .section-title {
    font-size: 24px;
  }
}

@media (min-width: 1024px) {
  #container {
    padding: 64px;
  }
  
  :deep(.md-card) {
    margin-bottom: 40px;
  }
}

/* Enhanced dark mode support */
@media (prefers-color-scheme: dark) {
  #container {
    --md-sys-color-surface: #141218;
    --md-sys-color-on-surface: #e6e0e9;
    --md-sys-color-surface-variant: #49454f;
    --md-sys-color-outline-variant: #4a4458;
  }
  
  .card-header-title h2 {
    color: var(--md-sys-color-on-surface, #e6e0e9);
  }
  
  .card-header-title:hover {
    background: rgba(208, 188, 255, 0.04);
  }
  
  .debug-active {
    background: linear-gradient(135deg, 
      rgba(255, 152, 0, 0.12) 0%, 
      rgba(255, 152, 0, 0.06) 100%);
    border-color: rgba(255, 152, 0, 0.3);
  }
}

/* Performance optimizations */
:deep(.md-card),
:deep(.md-button),
.section-title,
.card-header-title {
  will-change: transform;
  contain: layout style paint;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  :deep(.md-card),
  :deep(.md-button),
  .card-header-title,
  .debug-active {
    animation: none;
    transition: none;
  }
  
  :deep(.md-card:hover),
  .card-header-title:hover {
    transform: none;
  }
}

/* High contrast support */
@media (prefers-contrast: high) {
  :deep(.md-card) {
    border-width: 2px;
  }
  
  .section-title::after {
    height: 2px;
  }
  
  .debug-active {
    border-width: 2px;
  }
}
</style>
