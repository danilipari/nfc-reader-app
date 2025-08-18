import { CapacitorHttp } from '@capacitor/core';

export interface ApiResponse {
  success: boolean;
  status?: number;
  data?: any;
  error?: string;
}

export class ApiService {
  private readonly apiUrl: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL;
  }

  async sendTagToAPI(serial: string): Promise<ApiResponse> {
    try {
      const requestBody = { serial };
      
      console.log('API Request:', JSON.stringify(requestBody, null, 2));
      
      const response = await CapacitorHttp.request({
        url: this.apiUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: requestBody
      });
      
      console.log('API Response Status:', response.status);
      
      if (response.status >= 200 && response.status < 300) {
        const result = response.data;
        console.log('API Response Body:', JSON.stringify(result, null, 2));
        
        if (result.error) {
          console.error('API Error:', JSON.stringify(result.error, null, 2));
          return {
            success: false,
            error: result.error.message || 'Errore nella risposta',
            status: response.status
          };
        }
        
        return {
          success: true,
          status: response.status,
          data: result
        };
      } else {
        console.error('API Error Response:', response.status, response.data);
        return {
          success: false,
          error: `Errore HTTP ${response.status}: ${response.data || 'Errore sconosciuto'}`,
          status: response.status
        };
      }
      
    } catch (error) {
      console.error('API Call Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore durante l\'invio dei dati'
      };
    }
  }
}

// Singleton instance
export const apiService = new ApiService();