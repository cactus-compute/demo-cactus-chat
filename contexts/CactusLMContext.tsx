import React, { createContext, useContext, ReactNode } from 'react';
import { useCactusLM as useBaseCactusLM } from 'cactus-react-native';

import { useSettingsStore } from '../store/settingsStore';

type CactusLMContextType = ReturnType<typeof useBaseCactusLM>;

const CactusLMContext = createContext<CactusLMContextType | null>(null);

interface CactusLMProviderProps {
  children: ReactNode;
}

export function CactusLMProvider({ children }: CactusLMProviderProps) {
  const { selectedModelSlug } = useSettingsStore();

  const cactusLM = useBaseCactusLM({
    model: selectedModelSlug || undefined,
  });

  return (
    <CactusLMContext.Provider value={cactusLM}>
      {children}
    </CactusLMContext.Provider>
  );
}

export function useCactusLM() {
  const context = useContext(CactusLMContext);
  if (!context) {
    throw new Error('useCactusLM must be used within a CactusLMProvider');
  }
  return context;
}
