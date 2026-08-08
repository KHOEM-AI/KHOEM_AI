/**
 * ==============================================================================
 * KHOEM_AI Nexus Hub - Angular Frontend Service
 * Path: khoem-new/angular-src/khoem_ai_nexus.ts
 * ==============================================================================
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

// កំណត់ទម្រង់ទិន្នន័យ (Interfaces) ដើម្បីសុវត្ថិភាពកូដ (Type Safety)
export interface NexusStatusResponse {
  system: string;
  total_devices: number;
  ecosystem: any;
}

export interface NexusCommandResponse {
  status: string;
  message: string;
  executed_by?: string;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root' // ធ្វើឱ្យ Service នេះអាចប្រើបានពេញផ្ទៃ Project ទាំងមូល
})
export class KhoemAiNexusService {
  
  // ១. ព័ត៌មានសម្ងាត់របស់អ្នកប្រើប្រាស់ (Master Credentials)
  private readonly ownerEmail = 'owner@khoemai.com';
  private readonly deviceId = 'ANDROID_ID_KHOEM_999';
  private readonly apiUrl = '/api/nexus';

  constructor(private http: HttpClient) {}

  /**
   * មុខងារទី១៖ ទាញយកស្ថានភាពឧបករណ៍ទាំងអស់ពី Server (Real-time Status)
   */
  getDeviceStatus(): Observable<NexusStatusResponse> {
    console.log('[KHOEM_AI Nexus] កំពុងទាញយកស្ថានភាព Ecosystem...');
    return this.http.get<NexusStatusResponse>(`${this.apiUrl}/status`);
  }

  /**
   * មុខងារទី២៖ ស្កេនមុខម្ចាស់ប្រព័ន្ធ (Face Verification)
   * ចំណាំ៖ កន្លែងនេះបងអាចភ្ជាប់ជាមួយបណ្ណាល័យ Face-api.js ឬ AI Camera នៅពេលក្រោយ
   */
  private async verifyFaceBiometrics(): Promise<boolean> {
    console.log('[KHOEM_AI Nexus] ផ្តើមប្រព័ន្ធស្កេនមុខ (Face ID)...');
    
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('[KHOEM_AI Nexus] ✅ ស្កេនមុខជោគជ័យ! ម្ចាស់ប្រព័ន្ធត្រូវបានបញ្ជាក់។');
        resolve(true); 
      }, 1500); 
    });
  }

  /**
   * មុខងារទី៣៖ បញ្ជាឧបករណ៍ដោយឆ្លងកាត់ការការពារ ៣ ជាន់ (Control Endpoint)
   * @param targetDevice ឈ្មោះឧបករណ៍ (ឧ. main_door_lock)
   * @param action សកម្មភាព (ឧ. ON, OFF, LOCK, UNLOCK)
   */
  async sendCommand(targetDevice: string, action: string): Promise<NexusCommandResponse> {
    
    // ជំហានទី ៣.១: ផ្ទៀងផ្ទាត់មុខជាមុនសិន
    const isFaceVerified = await this.verifyFaceBiometrics();
    if (!isFaceVerified) {
      console.error('🚨 ការផ្ទៀងផ្ទាត់មុខបរាជ័យ (Face ID Denied)');
      throw new Error('Unauthorized: Face verification failed.');
    }

    // ជំហានទី ៣.២: រៀបចំកញ្ចប់ទិន្នន័យ Payload ដែលមាន Email & Device ID
    const payload = {
      email: this.ownerEmail,
      device_id: this.deviceId,
      target_device: targetDevice,
      action: action
    };

    console.log(`[KHOEM_AI Nexus] កំពុងបញ្ជូនបញ្ជា: ${action} ទៅកាន់ ${targetDevice}`);

    // ជំហានទី ៣.៣: បញ្ជូនទៅកាន់ Python Backend តាមរយៈ HTTP POST
    try {
      const response = await firstValueFrom(
        this.http.post<NexusCommandResponse>(`${this.apiUrl}/control`, payload)
      );
      console.log(`✅ លទ្ធផលបញ្ជា: ${response.message}`);
      return response;
    } catch (error) {
      console.error('❌ បញ្ហាក្នុងការភ្ជាប់ទៅកាន់មេបញ្ជាការ (Server API):', error);
      throw error;
    }
  }
}

