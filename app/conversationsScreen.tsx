import { useEffect, useState, useCallback } from "react";
import { Button, ScrollView, XStack, YStack } from "tamagui";
import { router } from "expo-router";
import { PenSquare, Trash, Check, X } from "@tamagui/lucide-icons";
import { Dimensions, Alert } from 'react-native';

import OnboardingScreenLayout from "@/components/ui/onboarding/OnboardingScreenLayout";
import { RegularText } from "@/components/ui/RegularText";
import { PageHeader } from "@/components/ui/PageHeader";
import { Conversation, getConversations, deleteConversation } from '../services/storage';
import { useModelContext } from "@/contexts/modelContext";
import { generateUniqueId } from "@/services/chat/llama-local";

export default function SettingsScreen() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
    const { conversationId, setConversationId } = useModelContext();

    const screenHeight = Dimensions.get('window').height;

    const loadConversations = useCallback(async () => {
        const conversationsFromStorage = await getConversations();
        setConversations(conversationsFromStorage);
    }, []);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    const createNewConversation = () => {
        const newId = generateUniqueId();
        setConversationId(newId);
        router.back();
    };

    const selectConversation = (id: string) => {
        setConversationId(id);
        router.back();
    };

    const handleLongPress = (id: string) => {
        if (!isSelectionMode) {
            setIsSelectionMode(true);
            setSelectedConversations([id]);
        }
    };

    const handleConversationPress = (id: string) => {
        if (isSelectionMode) { toggleConversationSelection(id); } 
        else { selectConversation(id); }
    };

    const toggleConversationSelection = (id: string) => {
        setSelectedConversations(prev => {
            const isSelected = prev.includes(id);
            const newSelection = isSelected  ? prev.filter(convId => convId !== id) : [...prev, id];
            if (newSelection.length === 0) { setIsSelectionMode(false); }
            return newSelection;
        });
    };

    const handleMultipleDelete = () => {
        if (selectedConversations.length === 0) return;

        Alert.alert(
            "Delete Conversations",
            `Are you sure you want to delete ${selectedConversations.length} conversation${selectedConversations.length > 1 ? 's' : ''}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        console.log('Starting deletion of conversations:', selectedConversations);
                        try {
                            const idsToDelete = [...selectedConversations];
                            if (idsToDelete.includes(conversationId)) {
                                console.log('Current conversation is being deleted, resetting conversationId');
                                const newId = generateUniqueId();
                                setConversationId(newId);
                            }
                            for (const id of idsToDelete) {
                                console.log(`Deleting conversation: ${id}`);
                                await deleteConversation(id);
                                console.log(`Successfully deleted conversation: ${id}`);
                            }
                            console.log('All conversations deleted successfully');
                            await loadConversations();
                            console.log('Conversations list refreshed');
                            setIsSelectionMode(false);
                            setSelectedConversations([]);
                        } catch (error) {
                            console.error('Error deleting conversations:', error);
                            Alert.alert("Error", `Failed to delete conversations: ${error}`);
                        }
                    }
                }
            ]
        );
    };
    
    const exitSelectionMode = () => {
        setIsSelectionMode(false);
        setSelectedConversations([]);
    };

    return (
        <OnboardingScreenLayout>
            <XStack paddingVertical="$4" paddingHorizontal="$2.5">
                {isSelectionMode ? (
                    <>
                        <Button 
                            size="$2" 
                            chromeless
                            icon={<X size="$1"/>} 
                            onPress={exitSelectionMode}
                        />
                        <XStack flex={1} justifyContent="center">
                            <RegularText fontWeight="600">
                                {selectedConversations.length} selected
                            </RegularText>
                        </XStack>
                        <Button 
                            size="$2" 
                            chromeless
                            icon={<Trash size="$1" color="$red10"/>} 
                            onPress={handleMultipleDelete}
                            disabled={selectedConversations.length === 0}
                        />
                    </>
                ) : (
                    <>
                        <Button size="$2"/>
                        <XStack flex={1}>
                            <PageHeader title="Conversations"/>
                        </XStack>
                        <Button size="$2" icon={<PenSquare size="$1"/>} marginTop="$1" onPress={createNewConversation}/>
                    </>
                )}
            </XStack>
            
            <ScrollView width="100%" style={{ height: screenHeight * 0.8 }}>
                <YStack gap="$4">
                    {conversations.length > 0 ? conversations.map((conversation) => (
                        <YStack 
                            key={conversation.id} 
                            paddingHorizontal="$4" 
                            onPress={() => handleConversationPress(conversation.id)}
                            onLongPress={() => handleLongPress(conversation.id)}
                            backgroundColor={
                                isSelectionMode && selectedConversations.includes(conversation.id) 
                                    ? "$gray3" 
                                    : "transparent"
                            }
                            borderRadius="$2"
                            pressStyle={{
                                backgroundColor: isSelectionMode ? undefined : "$gray2"
                            }}
                        >
                            <XStack justifyContent="space-between" alignItems="center">
                                {isSelectionMode && (
                                    <Button
                                        size="$2"
                                        circular
                                        chromeless
                                        backgroundColor={
                                            selectedConversations.includes(conversation.id) 
                                                ? "black" 
                                                : "$gray6"
                                        }
                                        marginRight="$2"
                                        onPress={() => toggleConversationSelection(conversation.id)}
                                        borderWidth={selectedConversations.includes(conversation.id) ? 0 : 1}
                                        borderColor="$gray8"
                                    >
                                        {selectedConversations.includes(conversation.id) && (
                                            <Check size="$1" color="white"/>
                                        )}
                                    </Button>
                                )}
                                <YStack flex={1}>
                                    <RegularText textAlign='left' fontWeight={600}>
                                        {conversation.title}
                                    </RegularText>
                                    <XStack>
                                        <RegularText textAlign='left' flex={1}>
                                            {conversation.model.value}
                                        </RegularText>
                                        <RegularText>
                                            {new Date(conversation.lastUpdated).toLocaleDateString()}
                                        </RegularText>
                                    </XStack>
                                </YStack>
                            </XStack>
                        </YStack>
                    )) : (
                        <RegularText>No conversations yet. Get chatting!</RegularText>
                    )}
                </YStack>
            </ScrollView>
        </OnboardingScreenLayout>
    );
}