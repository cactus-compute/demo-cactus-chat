"use strict";

import { NitroModules } from 'react-native-nitro-modules';
import { Platform } from 'react-native';
import { CactusFileSystem } from "./CactusFileSystem.js";
export class CactusUtil {
  static hybridCactusUtil = NitroModules.createHybridObject('CactusUtil');
  static async registerApp(encryptedData) {
    if (Platform.OS === 'android') {
      const cactusDirectory = await CactusFileSystem.getCactusDirectory();
      this.hybridCactusUtil.setAndroidDataDirectory(cactusDirectory);
    }
    return this.hybridCactusUtil.registerApp(encryptedData);
  }
  static async getDeviceId() {
    if (Platform.OS === 'android') {
      const cactusDirectory = await CactusFileSystem.getCactusDirectory();
      this.hybridCactusUtil.setAndroidDataDirectory(cactusDirectory);
    }
    return this.hybridCactusUtil.getDeviceId();
  }
}
//# sourceMappingURL=CactusUtil.js.map