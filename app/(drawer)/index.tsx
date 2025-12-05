import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Menu, Settings } from 'lucide-react-native';
import type { Message } from 'cactus-react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { ChatBubble } from '../../components/ChatBubble';
import { MessageInput } from '../../components/MessageInput';
import { useChatStore, type MessageWithMetrics } from '../../store/chatStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useCactusLM } from '../../contexts/CactusLMContext';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { saveImageToDocuments } from '../../utils/imageHelpers';

export default function ChatScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentModelSupportsVision, setCurrentModelSupportsVision] = useState(false);
  const [currentModelName, setCurrentModelName] = useState<string | null>(null);

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

  // Check if current model supports vision and get model name
  useEffect(() => {
    const checkVisionSupport = async () => {
      if (!selectedModelSlug) {
        setCurrentModelSupportsVision(false);
        setCurrentModelName(null);
        return;
      }

      try {
        const models = await cactusLM.getModels();
        const currentModel = models.find((m) => m.slug === selectedModelSlug);
        setCurrentModelSupportsVision(currentModel?.supportsVision || false);
        setCurrentModelName(currentModel?.name || null);
      } catch (error) {
        console.error('Error fetching models:', error);
        setCurrentModelSupportsVision(false);
        setCurrentModelName(null);
      }
    };

    checkVisionSupport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModelSlug]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Cactus Chat</Text>
          {currentModelName && (
            <Text style={styles.headerSubtitle}>{currentModelName}</Text>
          )}
        </View>
      ),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.headerButton}
        >
          <Menu size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={styles.headerButton}
        >
          <Settings size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, router, currentModelName]);

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
      content: text,
      images: savedImagePaths,
    };
    addMessage(userMessage);

    const messages: Message[] = [
      {
        role: 'system',
        content: reasoningMode ? systemPrompt : `/no_think ${systemPrompt}`,
      },
      ...currentMessages,
      {
        ...userMessage,
        content: reasoningMode ? text : `/no_think ${text}`,
      },
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
      flatListRef.current?.scrollToEnd();
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

      {!selectedModelSlug ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Welcome to Cactus Chat</Text>
          <Text style={styles.emptySubtext}>
            Get started by selecting a model
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Settings size={20} color={colors.background} />
            <Text style={styles.settingsButtonText}>Go to Settings</Text>
          </TouchableOpacity>
        </View>
      ) :
        <FlatList
          ref={flatListRef}
          data={displayMessages}
          keyExtractor={(_, index) => `message-${index}`}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.messageList}
        />
      }

      {selectedModelSlug && (
        <MessageInput
          onSend={handleSend}
          disabled={cactusLM.isGenerating}
          isGenerating={cactusLM.isGenerating}
          onStop={() => cactusLM.stop()}
          supportsVision={currentModelSupportsVision}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerTitleContainer: {
    alignItems: Platform.OS === 'android' ? 'flex-start' : 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.headingSmall,
    color: colors.textPrimary,
    textAlign: Platform.OS === 'android' ? 'left' : 'center',
  },
  headerSubtitle: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: Platform.OS === 'android' ? 'left' : 'center',
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
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  settingsButtonText: {
    ...typography.bodyMedium,
    color: colors.background,
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
