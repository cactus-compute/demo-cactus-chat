import { NitroModules } from 'react-native-nitro-modules';
import type { CactusCrypto as CactusCryptoSpec } from '../specs/CactusCrypto.nitro';

export class CactusCrypto {
  private static readonly hybridCactusCrypto =
    NitroModules.createHybridObject<CactusCryptoSpec>('CactusCrypto');

  public static uuidv5(namespaceUuid: string, name: string): Promise<string> {
    return this.hybridCactusCrypto.uuidv5(namespaceUuid, name);
  }
}
