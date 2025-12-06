import type { CactusModel, CactusSTTModel } from 'cactus-react-native';
import { Directory, Paths } from 'expo-file-system';

export function formatModelSize(sizeMb: number): string {
  if (sizeMb < 1024) {
    return `${sizeMb.toFixed(1)} MB`;
  }
  return `${(sizeMb / 1024).toFixed(2)} GB`;
}

export function getModelDisplayName(model: CactusModel): string {
  return model.name || model.slug;
}

export async function isModelDownloaded(model: CactusModel): Promise<boolean> {
  try {
    const modelDir = new Directory(Paths.document, 'cactus', 'models', model.slug);
    return modelDir.exists;
  } catch (error) {
    console.error('Error checking if model is downloaded:', error);
    return false;
  }
}

export async function deleteModel(model: CactusModel | CactusSTTModel): Promise<void> {
  try {
    const modelDir = new Directory(Paths.document, 'cactus', 'models', model.slug);

    if (modelDir.exists) {
      modelDir.delete();
    }
  } catch (error) {
    console.error('Error deleting model:', error);
    throw error;
  }
}
