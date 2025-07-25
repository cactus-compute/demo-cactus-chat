import { useEffect, useState } from "react";
import { Button, ScrollView, XStack, YStack } from "tamagui";
import { router } from "expo-router";
import { PenSquare } from "@tamagui/lucide-icons";
import { Dimensions } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

import OnboardingScreenLayout from "@/components/ui/onboarding/OnboardingScreenLayout";
import { RegularText } from "@/components/ui/RegularText";
import { PageHeader } from "@/components/ui/PageHeader";
import { Conversation, getConversations } from '../services/storage';
import { useModelContext } from "@/contexts/modelContext";
import { generateUniqueId } from "@/services/chat/llama-local";

export default function SettingsScreen() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const { setConversationId } = useModelContext()

    const screenHeight = Dimensions.get('window').height;

    useEffect(() => {
        const loadConversations = async () => {
          const conversations = await getConversations();
          setConversations(conversations);
        };
        
        loadConversations();
    }, []); 

    const createNewConversation = () => {
        const newId = generateUniqueId();
        setConversationId(newId);
        router.back();
    }

    const selectConversation = (id: string) => {
        setConversationId(id);
        router.back();
    }

    const iconColor = useThemeColor({}, 'icon');
    const surfaceColor = useThemeColor({}, 'surface');
    const borderColor = useThemeColor({}, 'border');

    return (
        <OnboardingScreenLayout>
            <XStack paddingVertical="$4" paddingHorizontal="$2.5">
                <Button size="$2"/>
                <XStack flex={1}>
                    <PageHeader title="Conversations"/>
                </XStack>
                <Button size="$2" icon={<PenSquare size="$1" color={iconColor}/>} marginTop="$1" onPress={createNewConversation}/>
            </XStack>
            <ScrollView width="100%" style={{ height: screenHeight * 0.8 }}>
                <YStack gap="$4">
                    { conversations.length > 0 ? conversations.map((conversation) => (
                        <YStack 
                            key={conversation.id} 
                            paddingHorizontal="$4" 
                            paddingVertical="$3"
                            backgroundColor={surfaceColor}
                            borderRadius="$4"
                            borderWidth={1}
                            borderColor={borderColor}
                            marginHorizontal="$4"
                            onPress={() => selectConversation(conversation.id)}
                        >
                            <RegularText textAlign='left' fontWeight={600}>{conversation.title}</RegularText>
                            <XStack>
                                <RegularText textAlign='left' flex={1}>{conversation.model.value}</RegularText>
                                <RegularText>{new Date(conversation.lastUpdated).toLocaleDateString()}</RegularText>
                            </XStack>
                        </YStack>
                    )) : (
                        <RegularText>No conversations yet. Get chatting!</RegularText>
                    )}
                </YStack>
            </ScrollView>
        </OnboardingScreenLayout>
    )
}