export declare class CactusFileSystem {
    private static readonly hybridCactusFileSystem;
    static getCactusDirectory(): Promise<string>;
    static fileExists(path: string): Promise<boolean>;
    static writeFile(path: string, content: string): Promise<void>;
    static readFile(path: string): Promise<string>;
    static deleteFile(path: string): Promise<void>;
    static modelExists(model: string): Promise<boolean>;
    static getModelPath(model: string): Promise<string>;
    static downloadModel(model: string, onProgress?: (progress: number) => void): Promise<void>;
    static deleteModel(model: string): Promise<void>;
}
//# sourceMappingURL=CactusFileSystem.d.ts.map