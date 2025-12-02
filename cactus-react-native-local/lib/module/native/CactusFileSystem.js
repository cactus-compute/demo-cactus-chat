"use strict";

import { NitroModules } from 'react-native-nitro-modules';
export class CactusFileSystem {
  static hybridCactusFileSystem = NitroModules.createHybridObject('CactusFileSystem');
  static getCactusDirectory() {
    return this.hybridCactusFileSystem.getCactusDirectory();
  }
  static fileExists(path) {
    return this.hybridCactusFileSystem.fileExists(path);
  }
  static writeFile(path, content) {
    return this.hybridCactusFileSystem.writeFile(path, content);
  }
  static readFile(path) {
    return this.hybridCactusFileSystem.readFile(path);
  }
  static deleteFile(path) {
    return this.hybridCactusFileSystem.deleteFile(path);
  }
  static modelExists(model) {
    return this.hybridCactusFileSystem.modelExists(model);
  }
  static getModelPath(model) {
    return this.hybridCactusFileSystem.getModelPath(model);
  }
  static downloadModel(model, onProgress) {
    const from = `https://vlqqczxwyaodtcdmdmlw.supabase.co/storage/v1/object/public/cactus-models/${model}.zip`;
    return this.hybridCactusFileSystem.downloadModel(model, from, onProgress);
  }
  static deleteModel(model) {
    return this.hybridCactusFileSystem.deleteModel(model);
  }
}
//# sourceMappingURL=CactusFileSystem.js.map