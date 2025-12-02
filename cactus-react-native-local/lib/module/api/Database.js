"use strict";

import { CactusUtil } from "../native/index.js";
import { packageVersion } from "../constants/packageVersion.js";
export class Database {
  static url = 'https://vlqqczxwyaodtcdmdmlw.supabase.co';
  static key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZscXFjenh3eWFvZHRjZG1kbWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MTg2MzIsImV4cCI6MjA2NzA5NDYzMn0.nBzqGuK9j6RZ6mOPWU2boAC_5H9XDs-fPpo5P3WZYbI';
  static async sendLogRecords(records) {
    const response = await fetch(`${this.url}/rest/v1/logs`, {
      method: 'POST',
      headers: {
        'apikey': this.key,
        'Authorization': `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        'Content-Profile': 'cactus',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(records)
    });
    if (!response.ok) {
      throw new Error('Sending logs failed');
    }
  }
  static async registerDevice(device_data) {
    const response = await fetch(`${this.url}/functions/v1/device-registration`, {
      method: 'POST',
      body: JSON.stringify({
        device_data
      })
    });
    if (!response.ok) {
      throw new Error('Registering device failed');
    }
    return await CactusUtil.registerApp(await response.text());
  }
  static async getModels() {
    const response = await fetch(`${this.url}/functions/v1/get-models?sdk_name=react&sdk_version=${packageVersion}-beta`, {
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`
      }
    });
    if (!response.ok) {
      throw new Error('Getting models failed');
    }
    const models = await response.json();
    return models.map(model => ({
      name: model.name,
      slug: model.slug,
      quantization: model.quantization,
      sizeMb: model.size_mb,
      downloadUrl: model.download_url,
      supportsToolCalling: model.supports_tool_calling,
      supportsVision: model.supports_vision,
      createdAt: model.created_at,
      isDownloaded: false
    }));
  }
}
//# sourceMappingURL=Database.js.map