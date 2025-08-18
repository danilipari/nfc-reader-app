<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Lettura Costante NFC</ion-title>
        <ion-button slot="start" fill="clear" @click="goBack">
          <ion-icon :icon="arrowBack"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Lettura Costante NFC</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Modalità Lettura Costante</ion-card-title>
            <ion-card-subtitle>Scansiona, invia e ricevi feedback immediato</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <!-- Pulsante per avviare/fermare la modalità continua -->
            <ion-button 
              @click="toggleContinuousMode" 
              expand="block" 
              :color="continuousMode ? 'danger' : 'primary'"
              :disabled="isProcessing"
              style="margin-bottom: 20px;"
            >
              <ion-icon :icon="continuousMode ? stopCircle : scan" slot="start"></ion-icon>
              {{ continuousMode ? 'Ferma Lettura' : 'Avvia Lettura Costante' }}
            </ion-button>

            <!-- Tag scansionato -->
            <div v-if="currentScannedTag" class="scanned-tag-section">
              <ion-card color="light">
                <ion-card-content>
                  <ion-text>
                    <h3>Tag Rilevato</h3>
                    <p><strong>Seriale:</strong> {{ currentScannedTag }}</p>
                  </ion-text>
                  
                  <!-- Pulsante di invio -->
                  <ion-button 
                    @click="sendToAPI" 
                    expand="block" 
                    color="success"
                    :disabled="isProcessing || !continuousMode"
                    style="margin-top: 15px;"
                  >
                    <ion-icon :icon="send" slot="start"></ion-icon>
                    {{ isProcessing ? 'Invio in corso...' : 'Invia alla API' }}
                  </ion-button>
                </ion-card-content>
              </ion-card>
            </div>

            <!-- Risultato della chiamata API -->
            <div v-if="apiResult" class="api-result-section">
              <ion-card :color="apiResult.success ? 'success' : 'danger'">
                <ion-card-content>
                  <ion-text :color="apiResult.success ? 'light' : 'light'">
                    <h3>{{ apiResult.success ? '✅ Successo' : '❌ Errore' }}</h3>
                    <p>{{ apiResult.message }}</p>
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
import { isPlatform } from '@ionic/vue';
import { NFC } from '@exxili/capacitor-nfc';
import { CapacitorHttp } from '@capacitor/core';
import { useRouter } from 'vue-router';

const router = useRouter();
const API_URL = import.meta.env.VITE_API_URL;

// Stato della modalità continua
const continuousMode = ref(false);
const currentScannedTag = ref<string | null>(null);
const isProcessing = ref(false);
const apiResult = ref<{ success: boolean; message: string; timestamp?: number } | null>(null);
const nfcListenersActive = ref(false);

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
  if (!isPlatform('capacitor')) {
    return false;
  }
  
  try {
    const { supported } = await NFC.isSupported();
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
      if (!continuousMode.value || isProcessing.value) {
        return;
      }
      
      try {
        let tagContent = '';
        
        // Stessa logica di parsing della HomePage
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
          currentScannedTag.value = tagContent;
          apiResult.value = null; // Reset del risultato precedente
          showToast(`Tag rilevato: ${tagContent}`, 'success');
        } else {
          showToast('Tag NFC rilevato ma senza dati NDEF', 'warning');
        }
        
      } catch (error) {
        showToast('Errore durante l\'elaborazione del tag NFC', 'danger');
      }
    });
    
    NFC.onError((error) => {
      showToast('Errore NFC: ' + error.error, 'danger');
    });
    
    nfcListenersActive.value = true;
    
  } catch (error) {
    showToast('Errore durante l\'inizializzazione NFC', 'danger');
  }
};

const toggleContinuousMode = async () => {
  if (!continuousMode.value) {
    // Avvia modalità continua
    if (!isPlatform('capacitor')) {
      showToast('NFC non disponibile in modalità web', 'warning');
      return;
    }
    
    const isSupported = await checkNFCStatus();
    if (!isSupported) {
      return;
    }
    
    await setupNFCListeners();
    
    if (isPlatform('ios')) {
      await NFC.startScan();
    }
    
    continuousMode.value = true;
    currentScannedTag.value = null;
    apiResult.value = null;
    showToast('Modalità lettura costante attivata', 'primary');
  } else {
    // Ferma modalità continua
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
    const requestBody = { serial: currentScannedTag.value };
    
    const response = await CapacitorHttp.request({
      url: API_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: requestBody
    });
    
    if (response.status >= 200 && response.status < 300) {
      const result = response.data;
      
      if (result.error) {
        throw new Error(result.error.message || 'Errore nella risposta');
      }
      
      apiResult.value = {
        success: true,
        message: `Successo! Status: ${response.status}`,
        timestamp: Date.now()
      };
      
      showToast('Tag inviato con successo!', 'success');
    } else {
      throw new Error(`Errore HTTP ${response.status}`);
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
    
    // Reset del tag corrente dopo l'invio (pronto per il prossimo)
    setTimeout(() => {
      currentScannedTag.value = null;
      apiResult.value = null;
    }, 2000);
  }
};

onMounted(async () => {
  await checkNFCStatus();
});

onUnmounted(async () => {
  if (continuousMode.value) {
    continuousMode.value = false;
  }
  
  if (isPlatform('capacitor') && nfcListenersActive.value) {
    try {
      await NFC.removeAllListeners('nfcTag');
      await NFC.removeAllListeners('nfcError');
    } catch (error) {
      console.warn('Errore durante la rimozione dei listener NFC:', error);
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