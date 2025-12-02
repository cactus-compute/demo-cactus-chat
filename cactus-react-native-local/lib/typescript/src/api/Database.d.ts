import type { DeviceInfo } from '../specs/CactusDeviceInfo.nitro';
import type { LogRecord } from '../telemetry/Telemetry';
import type { CactusModel } from '../types/CactusModel';
export declare class Database {
    private static readonly url;
    private static readonly key;
    static sendLogRecords(records: LogRecord[]): Promise<void>;
    static registerDevice(device_data: DeviceInfo): Promise<string>;
    static getModels(): Promise<CactusModel[]>;
}
//# sourceMappingURL=Database.d.ts.map