"use strict";

import { Database } from "../api/Database.js";
import { CactusCrypto, CactusDeviceInfo, CactusFileSystem, CactusUtil } from "../native/index.js";
import { CactusConfig } from "../config/CactusConfig.js";
import { packageVersion } from "../constants/packageVersion.js";
export class Telemetry {
  static namespaceUrl = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
  static logBufferPaths = {
    init: 'logs/init.json',
    completion: 'logs/completion.json',
    embedding: 'logs/embedding.json'
  };
  static async handleLog(logRecord) {
    if (!CactusConfig.isTelemetryEnabled) {
      return;
    }
    const logBufferPath = this.logBufferPaths[logRecord.event_type];
    let logs = [];
    if (await CactusFileSystem.fileExists(logBufferPath)) {
      try {
        logs = JSON.parse(await CactusFileSystem.readFile(logBufferPath));
      } catch {
        // Delete corrupted log buffer
        await CactusFileSystem.deleteFile(logBufferPath);
      }
    }
    logs.push(logRecord);
    try {
      await Database.sendLogRecords(logs);
      if (await CactusFileSystem.fileExists(logBufferPath)) {
        await CactusFileSystem.deleteFile(logBufferPath);
      }
    } catch {
      await CactusFileSystem.writeFile(logBufferPath, JSON.stringify(logs));
    }
  }
  static isInitialized() {
    return !!(this.projectId && this.deviceId);
  }
  static async init(cactusTelemetryToken) {
    if (!CactusConfig.isTelemetryEnabled) {
      return;
    }
    this.cactusTelemetryToken = cactusTelemetryToken;
    const appIdentifier = await CactusDeviceInfo.getAppIdentifier();
    const name = `https://cactus-react-native/${appIdentifier}/v1`;
    this.projectId = await CactusCrypto.uuidv5(this.namespaceUrl, name);
    const deviceInfo = await CactusDeviceInfo.getDeviceInfo();
    try {
      this.deviceId = (await CactusUtil.getDeviceId()) ?? (await Database.registerDevice(deviceInfo));
    } catch (error) {
      console.log(error);
    }
  }
  static logInit(model, success, message) {
    return this.handleLog({
      framework: 'react-native',
      framework_version: packageVersion,
      event_type: 'init',
      model,
      success,
      message,
      telemetry_token: this.cactusTelemetryToken,
      project_id: this.projectId,
      device_id: this.deviceId
    });
  }
  static logCompletion(model, success, message, result) {
    return this.handleLog({
      framework: 'react-native',
      framework_version: packageVersion,
      event_type: 'completion',
      model,
      success,
      message,
      telemetry_token: this.cactusTelemetryToken,
      project_id: this.projectId,
      device_id: this.deviceId,
      tokens: result?.totalTokens,
      response_time: result?.totalTimeMs,
      ttft: result?.timeToFirstTokenMs,
      tps: result?.tokensPerSecond
    });
  }
  static logEmbedding(model, success, message) {
    return this.handleLog({
      framework: 'react-native',
      framework_version: packageVersion,
      event_type: 'embedding',
      model,
      success,
      message,
      telemetry_token: this.cactusTelemetryToken,
      project_id: this.projectId,
      device_id: this.deviceId
    });
  }
}
//# sourceMappingURL=Telemetry.js.map