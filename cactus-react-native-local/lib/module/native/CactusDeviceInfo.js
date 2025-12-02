"use strict";

import { NitroModules } from 'react-native-nitro-modules';
export class CactusDeviceInfo {
  static hybridCactusDeviceInfo = NitroModules.createHybridObject('CactusDeviceInfo');
  static getAppIdentifier() {
    return this.hybridCactusDeviceInfo.getAppIdentifier();
  }
  static getDeviceInfo() {
    return this.hybridCactusDeviceInfo.getDeviceInfo();
  }
}
//# sourceMappingURL=CactusDeviceInfo.js.map