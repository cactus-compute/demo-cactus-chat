import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  maxTokens: number;
  temperature: number;
  topP: number;
  topK: number;
  reasoningMode: boolean;
  systemPrompt: string;
  selectedModelSlug: string | null;
  setMaxTokens: (maxTokens: number) => void;
  setTemperature: (temperature: number) => void;
  setTopP: (topP: number) => void;
  setTopK: (topK: number) => void;
  setReasoningMode: (enabled: boolean) => void;
  setSystemPrompt: (prompt: string) => void;
  setSelectedModelSlug: (slug: string | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      maxTokens: 2048,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      reasoningMode: false,
      systemPrompt: 'You are a helpful AI assistant.',
      selectedModelSlug: null,
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setTemperature: (temperature) => set({ temperature }),
      setTopP: (topP) => set({ topP }),
      setTopK: (topK) => set({ topK }),
      setReasoningMode: (enabled) => set({ reasoningMode: enabled }),
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      setSelectedModelSlug: (slug) => set({ selectedModelSlug: slug }),
    }),
    {
      name: 'cactus-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
