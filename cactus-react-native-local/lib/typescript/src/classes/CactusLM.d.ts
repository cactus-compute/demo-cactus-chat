import type { CactusLMDownloadParams, CactusLMCompleteParams, CactusLMCompleteResult, CactusLMEmbedParams, CactusLMEmbedResult, CactusLMGetModelsParams, CactusLMParams } from '../types/CactusLM';
import type { CactusModel } from '../types/CactusModel';
export declare class CactusLM {
    private readonly cactus;
    private readonly model;
    private readonly contextSize;
    private isDownloading;
    private isInitialized;
    private isGenerating;
    private static readonly defaultModel;
    private static readonly defaultContextSize;
    private static readonly defaultCompleteOptions;
    private static readonly defaultEmbedBufferSize;
    private static readonly modelsInfoPath;
    constructor({ model, contextSize }?: CactusLMParams);
    download({ onProgress, }?: CactusLMDownloadParams): Promise<void>;
    init(): Promise<void>;
    complete({ messages, options, tools, onToken, }: CactusLMCompleteParams): Promise<CactusLMCompleteResult>;
    embed({ text, }: CactusLMEmbedParams): Promise<CactusLMEmbedResult>;
    stop(): Promise<void>;
    reset(): Promise<void>;
    destroy(): Promise<void>;
    getModels({ forceRefresh, }?: CactusLMGetModelsParams): Promise<CactusModel[]>;
}
//# sourceMappingURL=CactusLM.d.ts.map