import { Stack } from 'expo-router';
import { ModelProvider } from '@/contexts/modelContext';
import { ThemeProvider } from '@/contexts/themeContext';
import { ThemeAwareTamaguiProvider } from '@/components/ThemeAwareTamaguiProvider';
import '@/language/i18nextConfig'; // needed for language translation context
import i18n from '@/language/i18nextConfig';
import { useEffect } from 'react';
// import { getLanguagePreference } from '@/services/storage';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as FileSystem from 'expo-file-system';


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  useEffect(() => {
    async function prepareAndRedirect() {
      try {
        // we proxy onboarding completion using the existence of the local-models folder
        const { exists: onboardingComplete } = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}local-models`)
        if(onboardingComplete){
          router.push('/');            
        }else{
          router.push('/functionalitySelectionScreen');            
        }
        i18n.changeLanguage('en')
        // const languagePreference = await getLanguagePreference();
        // if (languagePreference) {
        //   router.push('/functionalitySelectionScreen');
        // } else {
        //   router.push('/functionalitySelectionScreen');
        // }
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
    <ThemeProvider>
      <ThemeAwareTamaguiProvider>
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
      </ThemeAwareTamaguiProvider>
    </ThemeProvider>
  );
}
