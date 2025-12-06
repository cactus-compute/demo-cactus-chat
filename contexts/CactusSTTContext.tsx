import React, { createContext, useContext, ReactNode } from 'react';
import { useCactusSTT as useBaseCactusSTT } from 'cactus-react-native';

import { useSettingsStore } from '../store/settingsStore';

type CactusSTTContextType = ReturnType<typeof useBaseCactusSTT>;

const CactusSTTContext = createContext<CactusSTTContextType | null>(null);

interface CactusSTTProviderProps {
  children: ReactNode;
}

export function CactusSTTProvider({ children }: CactusSTTProviderProps) {
  const { selectedSTTModelSlug } = useSettingsStore();

  const cactusSTT = useBaseCactusSTT({
    model: selectedSTTModelSlug || undefined,
  });

  return (
    <CactusSTTContext.Provider value={cactusSTT}>
      {children}
    </CactusSTTContext.Provider>
  );
}

export function useCactusSTT() {
  const context = useContext(CactusSTTContext);
  if (!context) {
    throw new Error('useCactusSTT must be used within a CactusSTTProvider');
  }
  return context;
}
