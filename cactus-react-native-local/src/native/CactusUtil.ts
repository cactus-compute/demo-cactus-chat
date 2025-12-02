import { NitroModules } from 'react-native-nitro-modules';
import type { CactusUtil as CactusUtilSpec } from '../specs/CactusUtil.nitro';
import { Platform } from 'react-native';
import { CactusFileSystem } from './CactusFileSystem';

export class CactusUtil {
  private static readonly hybridCactusUtil =
    NitroModules.createHybridObject<CactusUtilSpec>('CactusUtil');

  public static async registerApp(encryptedData: string): Promise<string> {
    if (Platform.OS === 'android') {
      const cactusDirectory = await CactusFileSystem.getCactusDirectory();
      this.hybridCactusUtil.setAndroidDataDirectory(cactusDirectory);
    }

    return this.hybridCactusUtil.registerApp(encryptedData);
  }

  public static async getDeviceId(): Promise<string | null> {
    if (Platform.OS === 'android') {
      const cactusDirectory = await CactusFileSystem.getCactusDirectory();
      this.hybridCactusUtil.setAndroidDataDirectory(cactusDirectory);
    }

    return this.hybridCactusUtil.getDeviceId();
  }
}
