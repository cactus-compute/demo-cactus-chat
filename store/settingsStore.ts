import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  maxTokens: number;
  temperature: number;
  topP: number;
  topK: number;
  systemPrompt: string;
  selectedModelSlug: string | null;
  selectedSTTModelSlug: string | null;
  languageModelsExpanded: boolean;
  sttModelsExpanded: boolean;
  setMaxTokens: (maxTokens: number) => void;
  setTemperature: (temperature: number) => void;
  setTopP: (topP: number) => void;
  setTopK: (topK: number) => void;
  setSystemPrompt: (prompt: string) => void;
  setSelectedModelSlug: (slug: string | null) => void;
  setSelectedSTTModelSlug: (slug: string | null) => void;
  setLanguageModelsExpanded: (expanded: boolean) => void;
  setSTTModelsExpanded: (expanded: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      maxTokens: 512,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      systemPrompt: 'You are a helpful AI assistant.',
      selectedModelSlug: null,
      selectedSTTModelSlug: null,
      languageModelsExpanded: true,
      sttModelsExpanded: true,
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setTemperature: (temperature) => set({ temperature }),
      setTopP: (topP) => set({ topP }),
      setTopK: (topK) => set({ topK }),
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      setSelectedModelSlug: (slug) => set({ selectedModelSlug: slug }),
      setSelectedSTTModelSlug: (slug) => set({ selectedSTTModelSlug: slug }),
      setLanguageModelsExpanded: (expanded) => set({ languageModelsExpanded: expanded }),
      setSTTModelsExpanded: (expanded) => set({ sttModelsExpanded: expanded }),
    }),
    {
      name: 'cactus-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
