import React from 'react';
import { TamaguiProvider } from 'tamagui';
import { useTheme } from '@/contexts/themeContext';
import config from '../tamagui.config';

interface ThemeAwareTamaguiProviderProps {
  children: React.ReactNode;
}

export function ThemeAwareTamaguiProvider({ children }: ThemeAwareTamaguiProviderProps) {
  const { currentTheme } = useTheme();
  
  return (
    <TamaguiProvider config={config} defaultTheme={currentTheme}>
      {children}
    </TamaguiProvider>
  );
}