import type { DeviceInfo } from '../specs/CactusDeviceInfo.nitro';
export declare class CactusDeviceInfo {
    private static readonly hybridCactusDeviceInfo;
    static getAppIdentifier(): Promise<string | undefined>;
    static getDeviceInfo(): Promise<DeviceInfo>;
}
//# sourceMappingURL=CactusDeviceInfo.d.ts.map