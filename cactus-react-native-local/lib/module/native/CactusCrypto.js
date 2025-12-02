"use strict";

import { NitroModules } from 'react-native-nitro-modules';
export class CactusCrypto {
  static hybridCactusCrypto = NitroModules.createHybridObject('CactusCrypto');
  static uuidv5(namespaceUuid, name) {
    return this.hybridCactusCrypto.uuidv5(namespaceUuid, name);
  }
}
//# sourceMappingURL=CactusCrypto.js.map