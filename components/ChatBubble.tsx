import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import Markdown from 'react-native-markdown-display';
import type { MessageWithMetrics } from '../store/chatStore';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

interface ChatBubbleProps {
  message: MessageWithMetrics;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const hasMetrics =
    !isUser &&
    message.metrics &&
    message.metrics.decodeTokens !== undefined &&
    message.metrics.timeToFirstTokenMs !== undefined &&
    message.metrics.tokensPerSecond !== undefined;

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {isUser && message.images && message.images.length > 0 && (
        <ScrollView
          horizontal
          style={styles.imagesContainer}
          contentContainerStyle={styles.imagesContent}
          showsHorizontalScrollIndicator={false}
        >
          {message.images.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.messageImage} />
          ))}
        </ScrollView>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : null]}>
        {!isUser && message.images && message.images.length > 0 && (
          <ScrollView
            horizontal
            style={styles.imagesContainer}
            contentContainerStyle={styles.imagesContent}
            showsHorizontalScrollIndicator={false}
          >
            {message.images.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.messageImage} />
            ))}
          </ScrollView>
        )}
        {message.content && (
          isUser ? (
            <Text style={styles.text}>{message.content}</Text>
          ) : (
            <Markdown style={markdownStyles}>{message.content}</Markdown>
          )
        )}
        {hasMetrics && (
          <Text style={styles.metrics}>
            {message.metrics!.decodeTokens} tokens · TTFT {message.metrics!.timeToFirstTokenMs}ms · {message.metrics!.tokensPerSecond.toFixed(1)} t/s
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    marginHorizontal: spacing.lg,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    paddingVertical: spacing.md,
  },
  userBubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  text: {
    ...typography.body,
    color: colors.textPrimary,
  },
  imagesContainer: {
    marginBottom: spacing.sm,
  },
  imagesContent: {
    gap: spacing.sm,
  },
  messageImage: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  metrics: {
    ...typography.small,
    ...typography.mono,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    ...typography.body,
    color: colors.textPrimary,
  },
  heading1: {
    ...typography.headingLarge,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  heading2: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  heading3: {
    ...typography.headingSmall,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  paragraph: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: 0,
    marginBottom: spacing.sm,
  },
  code_inline: {
    ...typography.caption,
    ...typography.mono,
    backgroundColor: colors.surfaceCode,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  code_block: {
    ...typography.caption,
    ...typography.mono,
    backgroundColor: colors.surfaceCode,
    color: colors.textPrimary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  fence: {
    ...typography.caption,
    ...typography.mono,
    backgroundColor: colors.surfaceCode,
    color: colors.textPrimary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  strong: {
    fontWeight: '700',
  },
  em: {
    fontStyle: 'italic',
  },
  bullet_list: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  ordered_list: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  list_item: {
    marginBottom: spacing.xs,
  },
  blockquote: {
    backgroundColor: colors.surface,
    borderLeftColor: colors.textDisabled,
    borderLeftWidth: 4,
    paddingLeft: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  link: {
    color: colors.textPrimary,
    textDecorationLine: 'underline',
  },
});
