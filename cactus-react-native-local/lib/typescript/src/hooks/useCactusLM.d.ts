import type { CactusLMParams, CactusLMCompleteResult, CactusLMEmbedParams, CactusLMEmbedResult, CactusLMGetModelsParams, CactusLMCompleteParams, CactusLMDownloadParams } from '../types/CactusLM';
import type { CactusModel } from '../types/CactusModel';
export declare const useCactusLM: ({ model, contextSize, }?: CactusLMParams) => {
    completion: string;
    isGenerating: boolean;
    isInitializing: boolean;
    isDownloaded: boolean;
    isDownloading: boolean;
    downloadProgress: number;
    error: string | null;
    download: ({ onProgress }?: CactusLMDownloadParams) => Promise<void>;
    init: () => Promise<void>;
    complete: ({ messages, options, tools, onToken, }: CactusLMCompleteParams) => Promise<CactusLMCompleteResult>;
    embed: ({ text }: CactusLMEmbedParams) => Promise<CactusLMEmbedResult>;
    reset: () => Promise<void>;
    stop: () => Promise<void>;
    destroy: () => Promise<void>;
    getModels: ({ forceRefresh }?: CactusLMGetModelsParams) => Promise<CactusModel[]>;
};
//# sourceMappingURL=useCactusLM.d.ts.map