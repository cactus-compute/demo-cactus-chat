import { NitroModules } from 'react-native-nitro-modules';
import type {
  CactusDeviceInfo as CactusDeviceInfoSpec,
  DeviceInfo,
} from '../specs/CactusDeviceInfo.nitro';

export class CactusDeviceInfo {
  private static readonly hybridCactusDeviceInfo =
    NitroModules.createHybridObject<CactusDeviceInfoSpec>('CactusDeviceInfo');

  public static getAppIdentifier(): Promise<string | undefined> {
    return this.hybridCactusDeviceInfo.getAppIdentifier();
  }

  public static getDeviceInfo(): Promise<DeviceInfo> {
    return this.hybridCactusDeviceInfo.getDeviceInfo();
  }
}
