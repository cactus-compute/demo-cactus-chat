import { KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import { YStack } from "tamagui";
import { useThemeColor } from '@/hooks/useThemeColor';

export default function OnboardingScreenLayout ({ children }: { children: React.ReactNode }) {
    const backgroundColor = useThemeColor({}, 'background');
    
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor }}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
            <YStack flex={1} padding="$2" gap="$2" alignItems="center" backgroundColor={backgroundColor}>
                {children}
            </YStack>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}