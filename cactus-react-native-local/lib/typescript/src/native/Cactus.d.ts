import type { CactusLMCompleteResult, Message, Options, Tool } from '../types/CactusLM';
export declare class Cactus {
    private readonly hybridCactus;
    init(modelPath: string, contextSize: number): Promise<void>;
    complete(messages: Message[], responseBufferSize: number, options?: Options, tools?: Tool[], callback?: (token: string, tokenId: number) => void): Promise<CactusLMCompleteResult>;
    embed(text: string, embeddingBufferSize: number): Promise<number[]>;
    reset(): Promise<void>;
    stop(): Promise<void>;
    destroy(): Promise<void>;
}
//# sourceMappingURL=Cactus.d.ts.map