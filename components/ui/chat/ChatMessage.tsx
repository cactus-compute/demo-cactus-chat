import { XStack, YStack, Text, View } from 'tamagui';
import { ModelMetrics } from '@/utils/modelMetrics';
import { Model } from '@/services/models';
import Markdown from 'react-native-markdown-display';
import { generateUniqueId } from '@/services/chat/llama-local';
import { Copy } from '@tamagui/lucide-icons';
import { TouchableOpacity } from 'react-native';
import { Clipboard } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/contexts/themeContext';
import { Spinner } from 'tamagui';
import { Accordion } from 'tamagui';
import { ChevronDown } from '@tamagui/lucide-icons';
import { useState, useEffect } from 'react';


export interface Message {
  id: string;
  isUser: boolean;
  text: string;
  model: Model;
  metrics?: ModelMetrics;
}

interface ChatMessageProps {
  message: Message;
}

export const createUserMessage = (messageText: string, model: Model): Message => {
  return { id: generateUniqueId(), isUser: true, text: messageText, model: model };
}

export const createAIMessage = (messageText: string, model: Model, metrics?: ModelMetrics): Message => {
  return { id: generateUniqueId(), isUser: false, text: messageText, model: model, metrics: metrics };
} 

export function ChatMessage({ message }: ChatMessageProps) {
  const { isUser, text, metrics, model } = message;
  const { isDark } = useTheme();
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surface = useThemeColor({}, 'surface');
  const userBubbleColor = useThemeColor({ light: 'white', dark: surface }, 'surface');

  const markdownTextColor = isDark ? '#ECEDEE' : '#11181C';
  const markdownHeadingColor = isDark ? '#FFFFFF' : '#000000';

  let isReasoning = true;

  let reasoningText: string = "";
  let responseText: string = "";

  if (isUser) {
    if (text.startsWith('/no_think')){
      responseText = text.split('/no_think').at(1) || "";
    }
    else {
      responseText = text;
    }
  } else {
    if (text.includes('<think>')) {
      const reasoningStartSplit = text.split('<think>').at(1);
      if (reasoningStartSplit?.includes('</think>')) {
        const reasoningAndResponseSplits = reasoningStartSplit?.split('</think>');
        isReasoning = false
        reasoningText = (reasoningAndResponseSplits?.at(0) || "").trim();
        responseText = (reasoningAndResponseSplits?.at(1) || "").trim();
      } else {
        reasoningText = (reasoningStartSplit || "").trim();
      }
    }
    else {
      responseText = text;
    }
  }

  const [accordionValue, setAccordionValue] = useState(metrics ? '' : 'thinking');

  return (
    <XStack justifyContent={isUser ? 'flex-end' : 'flex-start'} paddingVertical={8}>
      <YStack 
        backgroundColor={isUser ? userBubbleColor : surface}
        padding={12}
        borderRadius="$6"
        elevation={0.2}
        maxWidth="85%"
      >
        {!isUser && model?.label && (
          <YStack marginBottom="$2">
            <Text color={textSecondary} fontSize={12} opacity={0.7} fontWeight={300}>
              {model.label}
            </Text>
          </YStack>
        )}
        {reasoningText.trim().length > 0 && (
          <Accordion type="single" collapsible value={accordionValue} onValueChange={(val) => setAccordionValue(accordionValue === 'thinking' ? '' : 'thinking')} overflow="hidden" borderWidth={0} padding={0} margin={0} backgroundColor="transparent">
            <Accordion.Item value="thinking" borderWidth={0} padding={0} margin={0} backgroundColor="transparent">
              <Accordion.Trigger borderWidth={0} padding={0} margin={0} backgroundColor="transparent">
                <XStack alignItems="center" gap="$1">
                  <Text color="$gray10" fontSize={12} opacity={0.7} fontWeight={300}>Reasoning</Text>
                  <ChevronDown size={12} color="$gray10" transform={[{ rotate: accordionValue === 'thinking' ? '180deg' : '0deg' }]} />
                </XStack>
              </Accordion.Trigger>
              <Accordion.Content borderWidth={0} padding={0} margin={0} backgroundColor="transparent">
                <Text color="$gray10" fontSize={12} opacity={0.7} fontWeight={300}>
                  {reasoningText}
                </Text>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>
        )}
        <Markdown
          style={{ 
            paragraph: { fontSize: 14, lineHeight: 21, fontWeight: '300', marginTop: 0, marginBottom: 0, color: isUser ? (isDark ? '#FFFFFF' : '#000000') : markdownTextColor },
            bullet_list_content: { fontSize: 14, lineHeight: 21, fontWeight: '300', marginTop: 0, marginBottom: 5, color: isUser ? (isDark ? '#FFFFFF' : '#000000') : markdownTextColor },
            ordered_list_content: { fontSize: 14, lineHeight: 21, fontWeight: '300', marginTop: 0, marginBottom: 5, color: isUser ? (isDark ? '#FFFFFF' : '#000000') : markdownTextColor },
            heading1: { fontSize: 26, lineHeight: 31, fontWeight: '400', marginTop: 10, marginBottom: 10, color: isUser ? (isDark ? '#FFFFFF' : '#000000') : markdownHeadingColor },
            heading2: { fontSize: 21, lineHeight: 31, fontWeight: '400', marginTop: 10, marginBottom: 10, color: isUser ? (isDark ? '#FFFFFF' : '#000000') : markdownHeadingColor },
            heading3: { fontSize: 18, lineHeight: 21, fontWeight: '400', marginTop: 10, marginBottom: 10, color: isUser ? (isDark ? '#FFFFFF' : '#000000') : markdownHeadingColor },
            heading4: { fontSize: 16, lineHeight: 21, fontWeight: '400', marginTop: 10, marginBottom: 10, color: isUser ? (isDark ? '#FFFFFF' : '#000000') : markdownHeadingColor },
            heading5: { fontSize: 14, lineHeight: 21, fontWeight: '400', marginTop: 10, marginBottom: 10, color: isUser ? (isDark ? '#FFFFFF' : '#000000') : markdownHeadingColor },
            heading6: { fontSize: 13, lineHeight: 21, fontWeight: '400', marginTop: 10, marginBottom: 10, color: isUser ? (isDark ? '#FFFFFF' : '#000000') : markdownHeadingColor },
            bullet_list_icon: { marginLeft: 5, marginRight: 5, lineHeight: 21, color: isUser ? (isDark ? '#FFFFFF' : '#000000') : markdownTextColor },
            ordered_list_icon: { marginLeft: 5, marginRight: 5, lineHeight: 21, color: isUser ? (isDark ? '#FFFFFF' : '#000000') : markdownTextColor },
            fence: { marginTop: 10, marginBottom: 10, backgroundColor: isDark ? '#2D3748' : '#F7FAFC', borderRadius: 6, padding: 8 },
            code_block: { borderWidth: 0, marginTop: 0, marginBottom: 0, paddingBottom: 0, color: isDark ? '#E2E8F0' : '#2D3748', fontFamily: 'monospace' },
          }}
          rules={{
            fence: (node, children, parent, styles) => {
              const codeContent = node.content || '';
              
              return (
                <View key={node.key} style={[styles.fence, { position: 'relative', paddingTop: 0, paddingBottom: 0 }]}>
                  <Text style={styles.code_block}>{codeContent}</Text>
                  
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: 5,
                      right: 5,
                      padding: 5,
                    }}
                    onPress={() => Clipboard.setString(codeContent)}
                  >
                    <Copy size={12} color={isDark ? '#A0AEC0' : '#718096'}/>
                  </TouchableOpacity>
                </View>
              );
            }
          }}
        >
          {responseText}
        </Markdown>
        
        {!isUser && metrics && (
          <YStack marginTop="$2">
            <Text color={textSecondary} fontSize={12} opacity={0.7} fontWeight={300}>
              Tokens: {metrics.completionTokens} • TTFT: {Math.round(metrics.timeToFirstToken)}ms • {Math.round(metrics.tokensPerSecond)} tok/sec
            </Text>
          </YStack>
        )}
      </YStack>
    </XStack>
  );
} 