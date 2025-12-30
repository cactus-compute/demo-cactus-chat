import React from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CactusLMProvider } from '../contexts/CactusLMContext';
import { CactusSTTProvider } from '../contexts/CactusSTTContext';
import { colors, typography } from '../constants/theme';
import { CactusConfig } from 'cactus-react-native';

CactusConfig.cactusProKey = '...';


export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <KeyboardProvider>
          <CactusLMProvider>
            <CactusSTTProvider>
              <Stack
                screenOptions={{
                  headerStyle: {
                    backgroundColor: colors.background,
                  },
                  headerTintColor: colors.textPrimary,
                  headerTitleStyle: {
                    ...typography.headingSmall,
                  },
                  headerShadowVisible: true,
                }}
              >
                <Stack.Screen
                  name="(drawer)"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="settings"
                  options={{
                    title: 'Settings',
                    presentation: 'card',
                    headerBackTitle: 'Chat',
                  }}
                />
              </Stack>
            </CactusSTTProvider>
          </CactusLMProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
