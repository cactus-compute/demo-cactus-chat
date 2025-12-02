import type { CactusLMCompleteResult } from '../types/CactusLM';
export interface LogRecord {
    framework: 'react-native';
    framework_version: string;
    event_type: 'init' | 'completion' | 'embedding';
    model: string;
    success: boolean;
    message?: string;
    telemetry_token?: string;
    project_id?: string;
    device_id?: string;
    tokens?: number;
    response_time?: number;
    ttft?: number;
    tps?: number;
}
export declare class Telemetry {
    private static cactusTelemetryToken?;
    private static projectId?;
    private static deviceId?;
    private static readonly namespaceUrl;
    private static readonly logBufferPaths;
    private static handleLog;
    static isInitialized(): boolean;
    static init(cactusTelemetryToken?: string): Promise<void>;
    static logInit(model: string, success: boolean, message?: string): Promise<void>;
    static logCompletion(model: string, success: boolean, message?: string, result?: CactusLMCompleteResult): Promise<void>;
    static logEmbedding(model: string, success: boolean, message?: string): Promise<void>;
}
//# sourceMappingURL=Telemetry.d.ts.map