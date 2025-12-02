import type { HybridObject } from 'react-native-nitro-modules';
export interface CactusFileSystem extends HybridObject<{
    ios: 'swift';
    android: 'kotlin';
}> {
    getCactusDirectory(): Promise<string>;
    fileExists(path: string): Promise<boolean>;
    writeFile(path: string, content: string): Promise<void>;
    readFile(path: string): Promise<string>;
    deleteFile(path: string): Promise<void>;
    modelExists(model: string): Promise<boolean>;
    getModelPath(model: string): Promise<string>;
    downloadModel(model: string, from: string, callback?: (progress: number) => void): Promise<void>;
    deleteModel(model: string): Promise<void>;
}
//# sourceMappingURL=CactusFileSystem.nitro.d.ts.map