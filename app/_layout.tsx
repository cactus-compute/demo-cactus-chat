import { Stack } from 'expo-router';
import { TamaguiProvider } from 'tamagui';
import config from '../tamagui.config';
import { ModelProvider } from '@/contexts/modelContext';
import '@/language/i18nextConfig'; // needed for language translation context
import i18n from '@/language/i18nextConfig';
import { useEffect } from 'react';
import { getOnboardingComplete } from '@/services/storage';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  useEffect(() => {
    async function prepareAndRedirect() {
      try {
        // Check if onboarding has been completed
        const onboardingComplete = await getOnboardingComplete();
        if(onboardingComplete){
          router.push('/');
        }else{
          router.push('/functionalitySelectionScreen');
        }
        i18n.changeLanguage('en')
      } catch (e) {
        console.warn('Error during initial setup:', e);
        router.push('/');
      } finally {
        SplashScreen.hideAsync();
      }
    }

    prepareAndRedirect();
  }, [router]);

  return (
    <TamaguiProvider config={config}>
      <ModelProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            {/* <Stack.Screen name="languageSelectionScreen"/> */}
            <Stack.Screen name="functionalitySelectionScreen"/>
            <Stack.Screen name="functionalityDownloadScreen"/>
            <Stack.Screen name="settingsScreen"/>
            <Stack.Screen name="conversationsScreen" options={{ presentation: "formSheet", contentStyle: { flex: 1 } }}/>
          </Stack>
      </ModelProvider>
    </TamaguiProvider>
  );
}
