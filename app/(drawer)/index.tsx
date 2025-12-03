import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { Message } from 'cactus-react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { ChatBubble } from '../../components/ChatBubble';
import { MessageInput } from '../../components/MessageInput';
import { useChatStore, type MessageWithMetrics } from '../../store/chatStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useCactusLM } from '../../contexts/CactusLMContext';
import { colors, spacing, typography } from '../../constants/theme';
import { saveImageToDocuments } from '../../utils/imageHelpers';

export default function ChatScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentModelSupportsVision, setCurrentModelSupportsVision] = useState(false);

  const {
    currentMessages,
    currentSessionId,
    addMessage,
    createNewSession,
    clearCurrentSession,
  } = useChatStore();
  const {
    selectedModelSlug,
    maxTokens,
    temperature,
    topP,
    topK,
    systemPrompt,
    reasoningMode,
  } = useSettingsStore();

  const cactusLM = useCactusLM();

  // Clear current session on mount to show clean chat
  useEffect(() => {
    clearCurrentSession();
  }, [clearCurrentSession]);

  // Check if current model supports vision
  useEffect(() => {
    const checkVisionSupport = async () => {
      if (!selectedModelSlug) {
        setCurrentModelSupportsVision(false);
        return;
      }

      try {
        const models = await cactusLM.getModels();
        const currentModel = models.find((m) => m.slug === selectedModelSlug);
        setCurrentModelSupportsVision(currentModel?.supportsVision || false);
      } catch (error) {
        console.error('Error fetching models:', error);
        setCurrentModelSupportsVision(false);
      }
    };

    checkVisionSupport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModelSlug]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.headerButton}
        >
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={styles.headerButton}
        >
          <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, router]);

  const lastResultRef = useRef<any>(null);

  const handleSend = async (text: string, images?: string[]) => {
    if (!selectedModelSlug || (!text.trim() && !images?.length)) {
      return;
    }

    if (!currentSessionId) {
      createNewSession();
    }

    let savedImagePaths: string[] | undefined;
    if (images?.length) {
      try {
        savedImagePaths = await Promise.all(images.map(saveImageToDocuments));
      } catch (error) {
        console.error('Error saving images:', error);
        savedImagePaths = images;
      }
    }

    const userMessage: Message = {
      role: 'user',
      content: text || 'Analyze this image',
      images: savedImagePaths,
    };
    addMessage(userMessage);

    const messages: Message[] = [
      {
        role: 'system',
        content: reasoningMode
          ? `${systemPrompt}\n\nPlease think through your response carefully and show your reasoning.`
          : systemPrompt,
      },
      ...currentMessages,
      userMessage,
    ];

    cactusLM.complete({
      messages,
      options: { maxTokens, temperature, topP, topK },
    }).then((result) => {
      lastResultRef.current = result;
    });
  };

  // Add assistant message to store when generation completes
  useEffect(() => {
    if (!cactusLM.isGenerating && cactusLM.completion && lastResultRef.current) {
      const result = lastResultRef.current;
      addMessage({
        role: 'assistant',
        content: cactusLM.completion,
        metrics: {
          timeToFirstTokenMs: result.timeToFirstTokenMs,
          tokensPerSecond: result.tokensPerSecond,
          decodeTokens: result.decodeTokens,
        },
      });
      lastResultRef.current = null;
    }
  }, [cactusLM.isGenerating, cactusLM.completion, addMessage]);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const displayMessages: MessageWithMetrics[] =
    cactusLM.isGenerating && cactusLM.completion
      ? [...currentMessages, { role: 'assistant', content: cactusLM.completion }]
      : currentMessages;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={80}
      style={styles.container}
    >
      {cactusLM.error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{cactusLM.error}</Text>
        </View>
      )}

      {displayMessages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.textDisabled} />
          <Text style={styles.emptyText}>Start a conversation</Text>
          <Text style={styles.emptySubtext}>
            {selectedModelSlug
              ? 'Type a message below'
              : 'Select a model in Settings first'}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={displayMessages}
          keyExtractor={(_, index) => `message-${index}`}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.messageList}
        />
      )}

      <MessageInput
        onSend={handleSend}
        disabled={cactusLM.isGenerating || !selectedModelSlug}
        isGenerating={cactusLM.isGenerating}
        onStop={() => cactusLM.stop()}
        supportsVision={currentModelSupportsVision}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    padding: spacing.sm,
  },
  messageList: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyText: {
    ...typography.headingLarge,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#ff4444',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.background,
  },
});
