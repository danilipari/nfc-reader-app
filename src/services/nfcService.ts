import { NFC } from '@exxili/capacitor-nfc';
import { isPlatform } from '@ionic/vue';
import { toastController } from '@ionic/vue';

export interface NFCReadData {
  serial: string;
}

export type NFCReadCallback = (data: NFCReadData) => void;
export type NFCErrorCallback = (error: string) => void;

export class NFCService {
  private isListenerActive = false;
  private onReadCallback: NFCReadCallback | null = null;
  private onErrorCallback: NFCErrorCallback | null = null;

  async isSupported(): Promise<boolean> {
    if (!isPlatform('capacitor')) {
      return false;
    }
    
    try {
      const { supported } = await NFC.isSupported();
      return supported;
    } catch (error) {
      console.error('Error checking NFC support:', error);
      return false;
    }
  }

  async setupListeners(
    onRead: NFCReadCallback, 
    onError: NFCErrorCallback
  ): Promise<boolean> {
    if (!isPlatform('capacitor') || this.isListenerActive) {
      return false;
    }
    
    try {
      this.onReadCallback = onRead;
      this.onErrorCallback = onError;
      
      NFC.onRead((data: any) => {
        const tagContent = this.parseNFCData(data);
        if (tagContent && this.onReadCallback) {
          this.onReadCallback({ serial: tagContent });
        } else if (this.onErrorCallback) {
          this.onErrorCallback('Tag NFC rilevato ma senza dati NDEF');
        }
      });
      
      NFC.onError((error) => {
        if (this.onErrorCallback) {
          this.onErrorCallback('Errore NFC: ' + error.error);
        }
      });
      
      this.isListenerActive = true;
      return true;
      
    } catch (error) {
      console.error('Error setting up NFC listeners:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback('Errore durante l\'inizializzazione NFC');
      }
      return false;
    }
  }

  async startScan(): Promise<void> {
    if (isPlatform('ios')) {
      await NFC.startScan();
    }
  }

  async removeListeners(): Promise<void> {
    if (isPlatform('capacitor') && this.isListenerActive) {
      try {
        await NFC.removeAllListeners('nfcTag');
        await NFC.removeAllListeners('nfcError');
        this.isListenerActive = false;
        this.onReadCallback = null;
        this.onErrorCallback = null;
      } catch (error) {
        console.warn('Error removing NFC listeners:', error);
      }
    }
  }

  private parseNFCData(data: any): string | null {
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
      
      return tagContent || null;
      
    } catch (error) {
      console.error('Error parsing NFC data:', error);
      return null;
    }
  }

  async showToast(message: string, color: string = 'primary'): Promise<void> {
    const toast = await toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}

export const nfcService = new NFCService();