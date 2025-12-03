import type { CactusModel } from 'cactus-react-native';
import * as FileSystem from 'expo-file-system/legacy';

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
    const modelPath = `${FileSystem.documentDirectory}cactus/models/${model.slug}`;
    const fileInfo = await FileSystem.getInfoAsync(modelPath);
    return fileInfo.exists;
  } catch (error) {
    console.error('Error checking if model is downloaded:', error);
    return false;
  }
}

export async function deleteModel(model: CactusModel): Promise<void> {
  try {
    const modelPath = `${FileSystem.documentDirectory}cactus/models/${model.slug}`;
    const fileInfo = await FileSystem.getInfoAsync(modelPath);

    if (fileInfo.exists) {
      await FileSystem.deleteAsync(modelPath, { idempotent: true });
    }
  } catch (error) {
    console.error('Error deleting model:', error);
    throw error;
  }
}
