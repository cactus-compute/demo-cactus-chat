import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CactusModel } from 'cactus-react-native';

interface ModelState {
  availableModels: CactusModel[];
  downloadedModels: CactusModel[];
  downloadingModels: Set<string>;
  downloadProgress: Record<string, number>;
  setAvailableModels: (models: CactusModel[]) => void;
  setDownloadedModels: (models: CactusModel[]) => void;
  startDownload: (slug: string) => void;
  updateDownloadProgress: (slug: string, progress: number) => void;
  completeDownload: (slug: string) => void;
  refreshModels: (allModels: CactusModel[]) => void;
}

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      availableModels: [],
      downloadedModels: [],
      downloadingModels: new Set(),
      downloadProgress: {},

      setAvailableModels: (models) => set({ availableModels: models }),

      setDownloadedModels: (models) => set({ downloadedModels: models }),

      startDownload: (slug) =>
        set((state) => ({
          downloadingModels: new Set([...state.downloadingModels, slug]),
          downloadProgress: { ...state.downloadProgress, [slug]: 0 },
        })),

      updateDownloadProgress: (slug, progress) =>
        set((state) => ({
          downloadProgress: { ...state.downloadProgress, [slug]: progress },
        })),

      completeDownload: (slug) =>
        set((state) => {
          const newDownloading = new Set(state.downloadingModels);
          newDownloading.delete(slug);
          const newProgress = { ...state.downloadProgress };
          delete newProgress[slug];
          return {
            downloadingModels: newDownloading,
            downloadProgress: newProgress,
          };
        }),

      refreshModels: (allModels) => {
        const downloaded = allModels.filter((m) => m.isDownloaded);
        const available = allModels.filter((m) => !m.isDownloaded);
        set({
          downloadedModels: downloaded,
          availableModels: available,
        });
      },
    }),
    {
      name: 'cactus-model-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        downloadedModels: state.downloadedModels,
        availableModels: state.availableModels,
      }),
    }
  )
);
