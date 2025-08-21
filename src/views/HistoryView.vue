<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div id="container">
        <!-- Hero Section -->
        <HeroSection
          title="Cronologia Tag NFC"
          description="Visualizza e gestisci tutti i tag NFC scansionati"
          :icon="timeOutline"
          variant="primary"
          size="compact"
          @dblclick="toggleHistoryDebugMode"
        />

        <!-- Action Buttons -->
        <MaterialCard v-if="!isSelectionMode" variant="elevated">
          <template #header>
            <h3 class="section-title">Azioni</h3>
          </template>
          
          <ActionGrid
            :actions="historyActions"
            columns="auto"
            gap="medium"
            responsive
            @action="handleHistoryAction"
          />
        </MaterialCard>

        <!-- Selection Mode Actions -->
        <MaterialCard v-if="isSelectionMode" variant="outlined">
          <template #header>
            <h3 class="section-title">
              <ion-icon :icon="checkboxOutline" class="selection-icon"></ion-icon>
              Modalità Selezione
            </h3>
          </template>
          
          <ActionGrid
            :actions="selectionActions"
            columns="auto"
            gap="small"
            responsive
            @action="handleSelectionAction"
          />
        </MaterialCard>

        <!-- Hidden file input for import -->
        <input 
          ref="fileInput" 
          type="file" 
          accept=".json,.txt" 
          @change="handleFileImport" 
          style="display: none;"
        />

        <!-- Tags List -->
        <MaterialCard v-if="tagsHistory.length > 0" variant="elevated">
          <template #header>
            <h3 class="section-title">
              Tag Scansionati ({{ tagsHistory.length }})
            </h3>
          </template>

          <ion-list>
            <ion-item-sliding v-for="tag in tagsHistory" :key="tag.id">
              <ion-item @click="isSelectionMode ? toggleTagSelection(tag.id) : openTagDetailModal(tag)">
                <ion-checkbox 
                  v-if="isSelectionMode"
                  :checked="selectedTagIds.has(tag.id)"
                  @ionChange="toggleTagSelection(tag.id)"
                  slot="start"
                  style="margin-right: 16px;"
                ></ion-checkbox>
                <ion-label>
                  <h3>{{ tag.name || 'Senza nome' }}</h3>
                  <p>{{ tag.serial }}</p>
                  <p>ID: {{ tag.employeeId }} - {{ new Date(tag.timestamp).toLocaleDateString() }}</p>
                  <p v-if="tag.sendStatus === 'completed' && tag.lastUpdate" style="font-size: 0.8em; color: var(--ion-color-medium);">
                    Aggiornato: {{ new Date(tag.lastUpdate).toLocaleString() }}
                  </p>
                  <pre v-if="showDebugMode && tag.apiResponse" style="font-size: 0.7em; background: #f5f5f5; padding: 5px; margin-top: 5px; border-radius: 3px;">{{ JSON.stringify(tag.apiResponse, null, 2) }}</pre>
                </ion-label>
                
                <StatusDisplay
                  v-if="!isSelectionMode"
                  :status="getTagStatus(tag.sendStatus)"
                  :message="getTagStatusMessage(tag.sendStatus)"
                  variant="inline"
                  slot="end"
                />
              </ion-item>
              
              <ion-item-options v-if="!isSelectionMode" side="end">
                <ion-item-option 
                  v-if="tag.sendStatus === 'pending' || tag.sendStatus === 'error'"
                  @click="sendTagAPI(tag)" 
                  color="success"
                >
                  <ion-icon :icon="send"></ion-icon>
                  Invia
                </ion-item-option>
                <ion-item-option 
                  v-if="tag.sendStatus === 'completed'"
                  @click="sendTagAPI(tag)" 
                  color="warning"
                >
                  <ion-icon :icon="send"></ion-icon>
                  Aggiorna
                </ion-item-option>
                <ion-item-option @click="confirmDeleteSingleTag(tag.id)" color="danger">
                  <ion-icon :icon="trash"></ion-icon>
                  Elimina
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          </ion-list>
        </MaterialCard>
        
        <!-- Empty State -->
        <MaterialCard v-else variant="outlined">
          <template #header>
            <h3 class="section-title">Nessun Tag Trovato</h3>
          </template>
          
          <div class="empty-state">
            <ion-icon :icon="documentOutline" class="empty-icon"></ion-icon>
            <p class="empty-message">Nessun tag nella cronologia</p>
            <MaterialButton 
              @click="triggerImportFile" 
              variant="outlined"
              size="medium"
            >
              <template #icon>
                <ion-icon :icon="cloudUploadOutline"></ion-icon>
              </template>
              Importa Backup
            </MaterialButton>
          </div>
        </MaterialCard>

        <!-- Edit Tag Form (shown when a tag is selected for editing) -->
        <MaterialCard v-if="selectedHistoryTag" variant="filled">
          <template #header>
            <h3 class="section-title">
              <ion-icon :icon="createOutline" class="edit-icon"></ion-icon>
              Modifica Tag: {{ selectedHistoryTag.serial }}
            </h3>
          </template>
          
          <ion-item>
            <ion-label position="stacked">Nome Tag</ion-label>
            <ion-input v-model="tagForm.name" placeholder="Nome tag"></ion-input>
          </ion-item>
          
          <ion-item>
            <ion-label position="stacked">ID Employee</ion-label>
            <ion-input v-model="tagForm.employeeId" placeholder="ID Employee"></ion-input>
          </ion-item>
          
          <div class="form-actions">
            <MaterialButton 
              @click="updateHistoryTag" 
              variant="filled"
              size="large"
            >
              <template #icon>
                <ion-icon :icon="checkmark"></ion-icon>
              </template>
              Salva Modifiche
            </MaterialButton>
          </div>
        </MaterialCard>
      </div>
    </ion-content>

    <!-- Tag Detail Modal -->
    <ion-modal :is-open="showTagDetailModal" @did-dismiss="closeTagDetailModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>Dettagli Tag</ion-title>
          <ion-button slot="end" fill="clear" @click="closeTagDetailModal">
            <ion-icon :icon="close"></ion-icon>
          </ion-button>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <div v-if="selectedHistoryTag" style="padding: 20px;">
          <MaterialCard variant="elevated">
            <ion-card-content>
              <ion-text>
                <h2>{{ selectedHistoryTag.name || 'Senza nome' }}</h2>
                <p><strong>Seriale:</strong> {{ selectedHistoryTag.serial }}</p>
                <p><strong>Employee ID:</strong> {{ selectedHistoryTag.employeeId }}</p>
                <p><strong>Data creazione:</strong> {{ new Date(selectedHistoryTag.timestamp).toLocaleString() }}</p>
                <p v-if="selectedHistoryTag.lastUpdate"><strong>Ultimo aggiornamento:</strong> {{ new Date(selectedHistoryTag.lastUpdate).toLocaleString() }}</p>
              </ion-text>
              
              <StatusDisplay
                :status="getTagStatus(selectedHistoryTag.sendStatus)"
                :title="getTagStatusTitle(selectedHistoryTag.sendStatus)"
                :message="getTagStatusMessage(selectedHistoryTag.sendStatus)"
                variant="card"
              />
            </ion-card-content>
          </MaterialCard>
          
          <MaterialCard variant="outlined">
            <template #header>
              <h3 class="section-title">Azioni</h3>
            </template>
            
            <ActionGrid
              :actions="tagDetailActions"
              :columns="1"
              gap="medium"
              @action="handleTagDetailAction"
            />
          </MaterialCard>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  IonContent, 
  IonPage,
  IonText,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonCheckbox,
  IonCardContent,
  toastController,
  alertController
} from '@ionic/vue';
import { 
  send, 
  trash, 
  checkmark, 
  checkmarkDone,
  close, 
  downloadOutline, 
  cloudUploadOutline, 
  trashOutline,
  timeOutline,
  documentOutline,
  checkboxOutline,
  createOutline
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { isPlatform } from '@ionic/vue';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { apiService } from '@/services/apiService';
import { 
  MaterialCard, 
  MaterialButton, 
  StatusDisplay, 
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

const showTagDetailModal = ref(false);
const showDebugMode = ref(false);
const tagsHistory = ref<NFCTag[]>([]);
const tagForm = ref({
  name: '',
  employeeId: ''
});
const selectedHistoryTag = ref<NFCTag | null>(null);
const selectedTagIds = ref<Set<string>>(new Set());
const isSelectionMode = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

// Computed properties for action grids
const historyActions = computed(() => [
  {
    id: 'export',
    label: 'Esporta',
    icon: downloadOutline,
    variant: 'filled' as const,
    disabled: tagsHistory.value.length === 0,
    action: () => exportHistory()
  },
  {
    id: 'import',
    label: 'Importa',
    icon: cloudUploadOutline,
    variant: 'outlined' as const,
    action: () => triggerImportFile()
  },
  {
    id: 'select',
    label: 'Seleziona',
    icon: checkmark,
    variant: 'tonal' as const,
    disabled: tagsHistory.value.length === 0,
    action: () => startSelectionMode()
  }
]);

const selectionActions = computed(() => [
  {
    id: 'select-all',
    label: 'Tutti',
    icon: checkmarkDone,
    variant: 'filled' as const,
    action: () => selectAllTags()
  },
  {
    id: 'deselect-all',
    label: 'Nessuno',
    icon: close,
    variant: 'outlined' as const,
    action: () => deselectAllTags()
  },
  {
    id: 'delete-selected',
    label: `Elimina (${selectedTagIds.value.size})`,
    icon: trashOutline,
    variant: 'filled' as const,
    disabled: selectedTagIds.value.size === 0,
    action: () => deleteSelectedTags()
  },
  {
    id: 'cancel-selection',
    label: 'Annulla',
    icon: close,
    variant: 'text' as const,
    action: () => exitSelectionMode()
  }
]);

const tagDetailActions = computed(() => {
  if (!selectedHistoryTag.value) return [];
  
  const actions = [];
  
  if (selectedHistoryTag.value.sendStatus === 'pending' || selectedHistoryTag.value.sendStatus === 'error') {
    actions.push({
      id: 'send',
      label: 'Invia al sistema',
      icon: send,
      variant: 'filled' as const,
      action: () => sendTagAPIFromModal()
    });
  }
  
  if (selectedHistoryTag.value.sendStatus === 'completed') {
    actions.push({
      id: 'update',
      label: 'Aggiorna il sistema',
      icon: send,
      variant: 'outlined' as const,
      action: () => sendTagAPIFromModal()
    });
  }
  
  actions.push({
    id: 'delete',
    label: 'Elimina Tag',
    icon: trash,
    variant: 'filled' as const,
    action: () => confirmDeleteCurrentTag()
  });
  
  return actions;
});

// Helper functions for status display
const getTagStatus = (sendStatus?: string) => {
  switch (sendStatus) {
    case 'completed':
    case 'sent':
      return 'success';
    case 'error':
      return 'error';
    case 'pending':
      return 'warning';
    default:
      return 'neutral';
  }
};

const getTagStatusTitle = (sendStatus?: string) => {
  switch (sendStatus) {
    case 'completed':
      return 'Completato';
    case 'sent':
      return 'Inviato';
    case 'error':
      return 'Errore';
    case 'pending':
      return 'Pendente';
    default:
      return 'Sconosciuto';
  }
};

const getTagStatusMessage = (sendStatus?: string) => {
  switch (sendStatus) {
    case 'completed':
      return 'Completato';
    case 'sent':
      return 'Inviato';
    case 'error':
      return 'Errore';
    case 'pending':
      return 'Pendente';
    default:
      return 'Sconosciuto';
  }
};

// Action handlers
const handleHistoryAction = (action: any) => {
  if (action.action && typeof action.action === 'function') {
    action.action();
  }
};

const handleSelectionAction = (action: any) => {
  if (action.action && typeof action.action === 'function') {
    action.action();
  }
};

const handleTagDetailAction = (action: any) => {
  if (action.action && typeof action.action === 'function') {
    action.action();
  }
};

// Storage functions
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

const showToast = async (message: string, color: string = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    position: 'bottom',
    color
  });
  await toast.present();
};

// History management functions
const updateHistoryTag = () => {
  if (!selectedHistoryTag.value) return;
  
  const oldEmployeeId = selectedHistoryTag.value.employeeId;
  const newEmployeeId = tagForm.value.employeeId.trim();
  
  const duplicateTag = tagsHistory.value.find(tag => 
    tag.employeeId === newEmployeeId && tag.id !== selectedHistoryTag.value!.id
  );
  
  if (duplicateTag) {
    showToast(`Employee ID ${newEmployeeId} già utilizzato per il tag ${duplicateTag.serial}`, 'danger');
    return;
  }
  
  selectedHistoryTag.value.name = tagForm.value.name.trim() || undefined;
  selectedHistoryTag.value.employeeId = newEmployeeId;
  
  if (oldEmployeeId !== newEmployeeId && (selectedHistoryTag.value.sendStatus === 'sent' || selectedHistoryTag.value.sendStatus === 'completed')) {
    selectedHistoryTag.value.sendStatus = 'pending';
    selectedHistoryTag.value.lastUpdate = undefined;
    showToast('Employee ID modificato - status resettato a pendente', 'warning');
  }
  
  const tagIndex = tagsHistory.value.findIndex(tag => tag.id === selectedHistoryTag.value!.id);
  if (tagIndex >= 0) {
    tagsHistory.value[tagIndex] = { ...selectedHistoryTag.value };
    saveTagsHistory();
    showToast('Tag aggiornato', 'success');
  }
  
  selectedHistoryTag.value = null;
};

const deleteHistoryTag = (tagId: string) => {
  if (selectedHistoryTag.value && selectedHistoryTag.value.id === tagId) {
    selectedHistoryTag.value = null;
    tagForm.value.name = '';
    tagForm.value.employeeId = '';
  }
  
  tagsHistory.value = tagsHistory.value.filter(tag => tag.id !== tagId);
  saveTagsHistory();
  showToast('Tag eliminato', 'success');
};

const sendTagAPI = async (tag: NFCTag) => {
  try {
    const response = await apiService.sendTagToAPI(tag.serial);
    
    if (response.success) {
      tag.sendStatus = 'completed';
      tag.lastSent = Date.now();
      tag.lastUpdate = Date.now();
      tag.apiResponse = response.data;
      showToast('Tag registrato con successo', 'success');
      
      const tagIndex = tagsHistory.value.findIndex(t => t.id === tag.id);
      if (tagIndex >= 0) {
        tagsHistory.value[tagIndex] = { ...tag };
        saveTagsHistory();
      }
    } else {
      tag.sendStatus = 'error';
      showToast(`Errore: ${response.error}`, 'danger');
    }
  } catch (error) {
    console.error('API Call Error:', error);
    tag.sendStatus = 'error';
    showToast(`Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`, 'danger');
  }
};

const toggleHistoryDebugMode = () => {
  showDebugMode.value = !showDebugMode.value;
  showToast(showDebugMode.value ? 'Debug cronologia attivato' : 'Debug cronologia disattivato', 'primary');
};

// Modal functions
const openTagDetailModal = (tag: NFCTag) => {
  selectedHistoryTag.value = tag;
  tagForm.value.name = tag.name || '';
  tagForm.value.employeeId = tag.employeeId || '';
  showTagDetailModal.value = true;
};

const closeTagDetailModal = () => {
  showTagDetailModal.value = false;
  selectedHistoryTag.value = null;
  tagForm.value.name = '';
  tagForm.value.employeeId = '';
};

const sendTagAPIFromModal = async () => {
  if (selectedHistoryTag.value) {
    await sendTagAPI(selectedHistoryTag.value);
    closeTagDetailModal();
  }
};

const deleteCurrentTag = () => {
  if (selectedHistoryTag.value) {
    deleteHistoryTag(selectedHistoryTag.value.id);
    closeTagDetailModal();
  }
};

// Selection mode functions
const startSelectionMode = () => {
  isSelectionMode.value = true;
  selectedTagIds.value.clear();
};

const exitSelectionMode = () => {
  isSelectionMode.value = false;
  selectedTagIds.value.clear();
};

const toggleTagSelection = (tagId: string) => {
  if (selectedTagIds.value.has(tagId)) {
    selectedTagIds.value.delete(tagId);
  } else {
    selectedTagIds.value.add(tagId);
  }
};

const selectAllTags = () => {
  selectedTagIds.value.clear();
  tagsHistory.value.forEach(tag => selectedTagIds.value.add(tag.id));
};

const deselectAllTags = () => {
  selectedTagIds.value.clear();
};

// Delete confirmation functions
const confirmDeleteSingleTag = async (tagId: string) => {
  const alert = await alertController.create({
    header: 'Conferma Eliminazione',
    message: 'Sei sicuro di voler eliminare questo tag?',
    buttons: [
      {
        text: 'Annulla',
        role: 'cancel'
      },
      {
        text: 'Elimina',
        role: 'destructive',
        handler: () => {
          deleteHistoryTag(tagId);
        }
      }
    ]
  });
  
  await alert.present();
};

const confirmDeleteCurrentTag = async () => {
  if (!selectedHistoryTag.value) return;
  
  const alert = await alertController.create({
    header: 'Conferma Eliminazione',
    message: `Sei sicuro di voler eliminare il tag "${selectedHistoryTag.value.name || selectedHistoryTag.value.serial}"?`,
    buttons: [
      {
        text: 'Annulla',
        role: 'cancel'
      },
      {
        text: 'Elimina',
        role: 'destructive',
        handler: () => {
          deleteCurrentTag();
        }
      }
    ]
  });
  
  await alert.present();
};

const deleteSelectedTags = async () => {
  if (selectedTagIds.value.size === 0) return;
  
  const alert = await alertController.create({
    header: 'Conferma Eliminazione Multipla',
    message: `Sei sicuro di voler eliminare ${selectedTagIds.value.size} tag selezionati? Questa azione non può essere annullata.`,
    buttons: [
      {
        text: 'Annulla',
        role: 'cancel'
      },
      {
        text: 'Elimina Tutti',
        role: 'destructive',
        handler: () => {
          const idsToDelete = Array.from(selectedTagIds.value);
          idsToDelete.forEach(id => deleteHistoryTag(id));
          
          showToast(`Eliminati ${idsToDelete.length} tag`, 'success');
          exitSelectionMode();
        }
      }
    ]
  });
  
  await alert.present();
};

// Import/Export functions
const exportHistory = async () => {
  try {
    const dataToExport = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      tags: tagsHistory.value
    };
    
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const fileName = `nfc-tags-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    if (isPlatform('capacitor')) {
      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: Directory.Documents,
          encoding: 'utf8' as any,
          recursive: true
        });
        
        const shareResult = await Share.share({
          title: 'Backup Tag NFC',
          text: `Backup di ${tagsHistory.value.length} tag NFC`,
          url: result.uri,
          dialogTitle: 'Salva o condividi il backup'
        });
        
        if (shareResult.activityType) {
          showToast(`Esportati ${tagsHistory.value.length} tag`, 'success');
        }
      } catch (shareError) {
        console.error('Share error:', shareError);
        showToast(`File salvato in Documents: ${fileName}`, 'success');
      }
    } else {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast(`Esportati ${tagsHistory.value.length} tag`, 'success');
    }
  } catch (error) {
    showToast('Errore durante l\'esportazione', 'danger');
    console.error('Export error:', error);
  }
};

const triggerImportFile = () => {
  fileInput.value?.click();
};

const handleFileImport = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  try {
    let text = await file.text();
    
    text = text.trim();
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }
    text = text.replace(/^[\x00-\x1F\x7F-\x9F]+/, '');
    
    if (!text.startsWith('{') && !text.startsWith('[')) {
      try {
        const decoded = atob(text);
        text = decodeURIComponent(escape(decoded));
        console.log('Decoded from base64');
      } catch (e) {
        console.log('Not base64 encoded, using original text');
      }
    }
    
    console.log('Importing JSON:', text.substring(0, 100));
    
    const importedData = JSON.parse(text);
    if (!importedData.tags || !Array.isArray(importedData.tags)) {
      throw new Error('Formato file non valido');
    }
    
    const validTags: NFCTag[] = [];
    const existingSerials = new Set(tagsHistory.value.map(t => t.serial));
    let skippedCount = 0;
    
    for (const tag of importedData.tags) {
      if (!tag.serial || !tag.id) {
        continue;
      }
      
      if (existingSerials.has(tag.serial)) {
        skippedCount++;
        continue;
      }
      
      const validTag: NFCTag = {
        id: tag.id,
        serial: tag.serial,
        name: tag.name || undefined,
        employeeId: tag.employeeId || undefined,
        timestamp: tag.timestamp || Date.now(),
        lastSent: tag.lastSent || undefined,
        lastUpdate: tag.lastUpdate || undefined,
        sendStatus: tag.sendStatus || 'pending',
        apiResponse: tag.apiResponse || undefined
      };
      
      validTags.push(validTag);
    }
    
    if (validTags.length === 0) {
      showToast('Nessun nuovo tag da importare', 'warning');
      return;
    }
    
    tagsHistory.value = [...tagsHistory.value, ...validTags];
    saveTagsHistory();
    
    let message = `Importati ${validTags.length} nuovi tag`;
    if (skippedCount > 0) {
      message += ` (${skippedCount} già esistenti)`;
    }
    showToast(message, 'success');
    
  } catch (error) {
    showToast('Errore durante l\'importazione: ' + (error instanceof Error ? error.message : 'Formato non valido'), 'danger');
    console.error('Import error:', error);
  } finally {
    if (target) {
      target.value = '';
    }
  }
};

onMounted(() => {
  loadTagsHistory();
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

/* Icon styles */
.selection-icon {
  color: #6750a4;
  font-size: 20px;
}

.edit-icon {
  color: #6750a4;
  font-size: 20px;
}

/* Empty state styling */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.empty-icon {
  font-size: 64px;
  color: var(--md-sys-color-outline);
  opacity: 0.6;
}

.empty-message {
  font-size: 16px;
  color: var(--md-sys-color-on-surface-variant);
  margin: 0;
}

/* Form actions */
.form-actions {
  padding: 24px 0;
  margin-top: 16px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
}

/* Enhanced Material components */
:deep(.md-button) {
  border-radius: 24px;
  font-weight: 500;
  letter-spacing: 0.1px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.md-status) {
  margin: 8px 0;
  border-radius: 12px;
}

/* List item enhancements */
:deep(ion-list) {
  background: transparent;
}

:deep(ion-item) {
  --background: transparent;
  --border-radius: 16px;
  --padding-start: 20px;
  --padding-end: 20px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

:deep(ion-item:hover) {
  --background: rgba(103, 80, 164, 0.04);
}

/* Advanced responsive design */
@media (min-width: 480px) {
  #container {
    padding: 32px;
  }
}

@media (min-width: 768px) {
  #container {
    padding: 48px;
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
  
  .empty-icon {
    color: var(--md-sys-color-outline);
  }
  
  .empty-message {
    color: var(--md-sys-color-on-surface-variant);
  }
}

/* Performance optimizations */
:deep(.md-card),
:deep(.md-button),
.section-title {
  will-change: transform;
  contain: layout style paint;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  :deep(.md-card),
  :deep(.md-button),
  :deep(ion-item) {
    animation: none;
    transition: none;
  }
  
  :deep(.md-card:hover),
  :deep(ion-item:hover) {
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
}
</style>