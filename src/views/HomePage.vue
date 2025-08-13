<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Dontouch Tags Reader</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Dontouch Tags Reader</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Employee NFC</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-button @click="startNFCReading" expand="block" :disabled="isReading">
              <ion-icon :icon="scan" slot="start"></ion-icon>
              {{ isReading ? 'Lettura in corso...' : 'Avvia Lettura NFC' }}
            </ion-button>
            
            <div v-if="currentTag && (currentTag.sendStatus === 'sent' || currentTag.sendStatus === 'completed')" class="nfc-result">
              <ion-text color="success">
                <h3>✓ {{ currentTag.sendStatus === 'completed' ? 'Completato' : 'Inviato' }}</h3>
                <p>{{ currentTag.serial }}</p>
                <p><strong>{{ currentTag.name || 'Senza nome' }}</strong> - ID: {{ currentTag.employeeId }}</p>
                <p v-if="currentTag.lastUpdate" style="font-size: 0.8em; color: var(--ion-color-medium);">
                  Ultimo aggiornamento: {{ new Date(currentTag.lastUpdate).toLocaleString() }}
                </p>
              </ion-text>
            </div>
            
            <div v-else-if="currentTag && currentTag.sendStatus === 'pending'" class="nfc-result">
              <ion-text>
                <h3>Tag Confermato</h3>
                <p>{{ currentTag.serial }}</p>
                <p><strong>{{ currentTag.name || 'Senza nome' }}</strong> - ID: {{ currentTag.employeeId }}</p>
                <p style="font-size: 0.9em; color: var(--ion-color-medium); margin-top: 10px;">
                  Usa la cronologia per inviare il tag all'API
                </p>
              </ion-text>
            </div>
            
            <div v-else-if="currentTag && currentTag.sendStatus === 'error'" class="nfc-result">
              <ion-text color="danger">
                <h3>✗ Errore Invio</h3>
                <p>{{ currentTag.serial }}</p>
                <p><strong>{{ currentTag.name || 'Senza nome' }}</strong> - ID: {{ currentTag.employeeId }}</p>
              </ion-text>
              
              <ion-button 
                @click="retryAPI" 
                expand="block" 
                color="warning"
                :disabled="isCallingAPI"
                style="margin-top: 10px;"
              >
                <ion-icon :icon="send" slot="start"></ion-icon>
                {{ isCallingAPI ? 'Tentativo in corso...' : 'Riprova Invio' }}
              </ion-button>
            </div>
            
            <ion-button 
              v-if="tagsHistory.length > 0"
              @click="openHistory" 
              expand="block" 
              fill="outline" 
              color="primary" 
              style="margin-top: 20px;"
            >
              <ion-icon :icon="time" slot="start"></ion-icon>
              Gestisci Cronologia ({{ tagsHistory.length }})
            </ion-button>
          </ion-card-content>
        </ion-card>
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
                <ion-label position="stacked">ID Employee *</ion-label>
                <ion-input v-model="tagForm.employeeId" placeholder="Inserisci ID Employee" required></ion-input>
              </ion-item>
              
              <ion-button @click="confirmTag" expand="block" color="success" style="margin-top: 20px;">
                <ion-icon :icon="checkmark" slot="start"></ion-icon>
                Conferma e Salva
              </ion-button>
            </div>
          </ion-content>
        </ion-modal>
        <ion-modal :is-open="showHistoryModal" @did-dismiss="closeHistoryModal">
          <ion-header>
            <ion-toolbar>
              <ion-title @dblclick="toggleDebugMode">Cronologia Tag NFC</ion-title>
              <ion-button slot="end" fill="clear" @click="closeHistoryModal">
                <ion-icon :icon="close"></ion-icon>
              </ion-button>
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <ion-list v-if="tagsHistory.length > 0">
              <ion-item-sliding v-for="tag in tagsHistory" :key="tag.id">
                <ion-item @click="openTagDetailModal(tag)">
                  <ion-label>
                    <h3>{{ tag.name || 'Senza nome' }}</h3>
                    <p>{{ tag.serial }}</p>
                    <p>ID: {{ tag.employeeId }} - {{ new Date(tag.timestamp).toLocaleDateString() }}</p>
                    <p v-if="tag.sendStatus === 'completed' && tag.lastUpdate" style="font-size: 0.8em; color: var(--ion-color-medium);">
                      Aggiornato: {{ new Date(tag.lastUpdate).toLocaleString() }}
                    </p>
                    <pre v-if="showDebugMode && tag.apiResponse" style="font-size: 0.7em; background: #f5f5f5; padding: 5px; margin-top: 5px; border-radius: 3px;">{{ JSON.stringify(tag.apiResponse, null, 2) }}</pre>
                  </ion-label>
                  <ion-badge 
                    :color="(tag.sendStatus === 'sent' || tag.sendStatus === 'completed') ? 'success' : tag.sendStatus === 'error' ? 'danger' : 'warning'"
                    slot="end"
                  >
                    {{ tag.sendStatus === 'completed' ? 'Completato' : tag.sendStatus === 'sent' ? 'Inviato' : tag.sendStatus === 'error' ? 'Errore' : 'Pendente' }}
                  </ion-badge>
                </ion-item>
                
                <ion-item-options side="end">
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
                  <ion-item-option @click="deleteHistoryTag(tag.id)" color="danger">
                    <ion-icon :icon="trash"></ion-icon>
                    Elimina
                  </ion-item-option>
                </ion-item-options>
              </ion-item-sliding>
            </ion-list>
            
            <div v-else style="padding: 20px; text-align: center;">
              <ion-text color="medium">
                <p>Nessun tag nella cronologia</p>
              </ion-text>
            </div>
            <div v-if="selectedHistoryTag" style="padding: 20px; border-top: 1px solid var(--ion-color-light);">
              <ion-text>
                <h4>Modifica Tag: {{ selectedHistoryTag.serial }}</h4>
              </ion-text>
              
              <ion-item>
                <ion-label position="stacked">Nome Tag</ion-label>
                <ion-input v-model="tagForm.name" placeholder="Nome tag"></ion-input>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">ID Employee</ion-label>
                <ion-input v-model="tagForm.employeeId" placeholder="ID Employee"></ion-input>
              </ion-item>
              
              <ion-button @click="updateHistoryTag" expand="block" color="primary" style="margin-top: 10px;">
                <ion-icon :icon="checkmark" slot="start"></ion-icon>
                Salva Modifiche
              </ion-button>
            </div>
          </ion-content>
        </ion-modal>
        
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
              <ion-card>
                <ion-card-content>
                  <ion-text>
                    <h2>{{ selectedHistoryTag.name || 'Senza nome' }}</h2>
                    <p><strong>Seriale:</strong> {{ selectedHistoryTag.serial }}</p>
                    <p><strong>Employee ID:</strong> {{ selectedHistoryTag.employeeId }}</p>
                    <p><strong>Data creazione:</strong> {{ new Date(selectedHistoryTag.timestamp).toLocaleString() }}</p>
                    <p v-if="selectedHistoryTag.lastUpdate"><strong>Ultimo aggiornamento:</strong> {{ new Date(selectedHistoryTag.lastUpdate).toLocaleString() }}</p>
                    <ion-badge :color="(selectedHistoryTag.sendStatus === 'sent' || selectedHistoryTag.sendStatus === 'completed') ? 'success' : selectedHistoryTag.sendStatus === 'error' ? 'danger' : 'warning'">
                      {{ selectedHistoryTag.sendStatus === 'completed' ? 'Completato' : selectedHistoryTag.sendStatus === 'sent' ? 'Inviato' : selectedHistoryTag.sendStatus === 'error' ? 'Errore' : 'Pendente' }}
                    </ion-badge>
                  </ion-text>
                </ion-card-content>
              </ion-card>
              
              <ion-card>
                <ion-card-header>
                  <ion-card-title>Azioni</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-button 
                    v-if="selectedHistoryTag.sendStatus === 'pending' || selectedHistoryTag.sendStatus === 'error'"
                    @click="sendTagAPIFromModal" 
                    expand="block" 
                    color="success"
                    style="margin-bottom: 10px;"
                  >
                    <ion-icon :icon="send" slot="start"></ion-icon>
                    Invia API
                  </ion-button>
                  
                  <ion-button 
                    v-if="selectedHistoryTag.sendStatus === 'completed'"
                    @click="sendTagAPIFromModal" 
                    expand="block" 
                    color="warning"
                    style="margin-bottom: 10px;"
                  >
                    <ion-icon :icon="send" slot="start"></ion-icon>
                    Aggiorna API
                  </ion-button>
                  
                  <ion-button @click="deleteCurrentTag" expand="block" color="danger">
                    <ion-icon :icon="trash" slot="start"></ion-icon>
                    Elimina Tag
                  </ion-button>
                </ion-card-content>
              </ion-card>
            </div>
          </ion-content>
        </ion-modal>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonText,
  IonModal,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonBadge,
  toastController
} from '@ionic/vue';
import { scan, send, time, trash, checkmark, close } from 'ionicons/icons';
import { isPlatform } from '@ionic/vue';
import { onMounted, onUnmounted } from 'vue';
import { NFC } from '@exxili/capacitor-nfc';
import { StatusBar, Style } from '@capacitor/status-bar';
import { CapacitorHttp } from '@capacitor/core';

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

const API_URL = import.meta.env.VITE_API_URL;
// const API_AUTH = import.meta.env.VITE_API_AUTH;
const STORAGE_KEY = 'nfc_tags_history';

const isReading = ref(false);
const nfcValue = ref('');
const isCallingAPI = ref(false);
const apiResponse = ref('');
const nfcEnabled = ref(false);
const nfcListenersActive = ref(false);
const showConfirmModal = ref(false);
const showHistoryModal = ref(false);
const showTagDetailModal = ref(false);
const showDebugMode = ref(false);
const currentTag = ref<NFCTag | null>(null);
const tagsHistory = ref<NFCTag[]>([]);
const tagForm = ref({
  name: '',
  employeeId: ''
});
const selectedHistoryTag = ref<NFCTag | null>(null);

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
  if (!tagForm.value.employeeId.trim()) {
    showToast('ID Employee è obbligatorio', 'warning');
    return;
  }
  
  if (!currentTag.value) return;
  
  const newEmployeeId = tagForm.value.employeeId.trim();
  const duplicateTag = tagsHistory.value.find(tag => 
    tag.employeeId === newEmployeeId && tag.serial !== currentTag.value!.serial
  );
  
  if (duplicateTag) {
    showToast(`Employee ID ${newEmployeeId} già utilizzato per il tag ${duplicateTag.serial}`, 'danger');
    return;
  }
  
  currentTag.value.name = tagForm.value.name.trim() || undefined;
  currentTag.value.employeeId = newEmployeeId;
  
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
    
    // const requestBody = {
    //   "jsonrpc": "2.0",
    //   "id": parseInt(currentTag.value.employeeId || '1'),
    //   "method": "eAccess.createRfidMedium",
    //   "params": [{ "uid": currentTag.value.serial }]
    // };

    const requestPorzioBody = { serial: `${currentTag.value.serial}` };
    
    console.log('API Request:', JSON.stringify(requestPorzioBody, null, 2));
    
    const response = await CapacitorHttp.request({
      url: API_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': API_AUTH
      },
      data: requestPorzioBody
    });
    
    console.log('API Response Status:', response.status);
    
    if (response.status >= 200 && response.status < 300) {
      const result = response.data;
      console.log('API Response Body:', JSON.stringify(result, null, 2));
      
      if (result.error) {
        console.error('API Error:', JSON.stringify(result.error, null, 2));
        throw new Error(result.error.message || 'Errore nella risposta');
      }
      currentTag.value.sendStatus = 'completed';
      currentTag.value.lastSent = Date.now();
      currentTag.value.lastUpdate = Date.now();
      currentTag.value.apiResponse = result;
      apiResponse.value = `Tag NFC registrato con successo! (${response.status})`;
      showToast(`Tag NFC registrato con successo! Status: ${response.status}`, 'success');
      
      const tagIndex = tagsHistory.value.findIndex(tag => tag.id === currentTag.value!.id);
      if (tagIndex >= 0) {
        tagsHistory.value[tagIndex] = { ...currentTag.value };
        saveTagsHistory();
      }
    } else {
      console.error('API Error Response:', response.status, response.data);
      throw new Error(`Errore HTTP ${response.status}: ${response.data || 'Errore sconosciuto'}`);
    }
    
  } catch (error) {
    console.error('API Call Error:', error);
    currentTag.value.sendStatus = 'error';
    apiResponse.value = `Errore: ${error instanceof Error ? error.message : 'Errore durante l\'invio dei dati'}`;
    showToast(`Errore API: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`, 'danger');
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

const openHistory = () => {
  showHistoryModal.value = true;
};

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

const closeHistoryModal = () => {
  if (!selectedHistoryTag.value) {
    currentTag.value = null;
    nfcValue.value = '';
  }
  selectedHistoryTag.value = null;
  showHistoryModal.value = false;
};

const sendTagAPI = async (tag: NFCTag) => {
  const previousTag = currentTag.value;
  currentTag.value = tag;
  
  try {
    await callAPI();
  } finally {
    currentTag.value = previousTag;
  }
};

const toggleDebugMode = () => {
  showDebugMode.value = !showDebugMode.value;
  showToast(showDebugMode.value ? 'Debug mode attivato' : 'Debug mode disattivato', 'primary');
};

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
  text-align: center;
  padding: 20px;
}

ion-card {
  max-width: 600px;
  margin: 20px auto;
}

.nfc-result {
  margin: 20px 0;
  padding: 15px;
  background-color: var(--ion-color-light);
  border-radius: 8px;
}

.nfc-result h3 {
  margin-top: 0;
  color: var(--ion-color-primary);
}

.nfc-result p {
  font-family: monospace;
  font-size: 16px;
  word-break: break-all;
}
</style>