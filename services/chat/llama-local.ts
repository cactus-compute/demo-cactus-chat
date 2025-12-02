import { Message } from '@/components/ui/chat/ChatMessage';
import { ModelMetrics } from '@/utils/modelMetrics';
import { CactusModel } from '../models';
import { useCactusLM } from 'cactus-react-native';
// import * as Haptics from 'expo-haptics';

export interface ChatProgressCallback {
  (text: string): void;
}

export interface ChatCompleteCallback {
  (metrics: ModelMetrics, model: CactusModel, completeMessage: string): void;
}

export async function streamLlamaCompletion(
  lm: ReturnType<typeof useCactusLM> | null,
  messages: Message[],
  model: CactusModel,
  onProgress: ChatProgressCallback,
  onComplete: ChatCompleteCallback,
  streaming: boolean = true,
  maxTokens: number,
  isReasoningEnabled: boolean,
  voiceMode?: boolean,
  systemPrompt?: string
) {
  try {
    console.log('Ensuring Llama context...', new Date().toISOString());
    if (!lm) {
      throw new Error('Failed to initialize Llama context');
    }
    console.log('Llama context initialized', new Date().toISOString());
    
    const stopWords = ['</s>', '<|end|>', '<|eot_id|>', '<|end_of_text|>',
                       '<|im_end|>', '<|EOT|>', '<|END_OF_TURN_TOKEN|>',
                       '<|end_of_turn|>', '<|endoftext|>', '<end_of_turn>', '<|end_of_sentence|>'];

    const voiceModePromptAddition = voiceMode ? 'Keep your messages VERY short. One-two sentences max.' : '';

    const formattedMessages = [
      {
        role: 'system' as const,
        content: `${systemPrompt} ${voiceModePromptAddition}`
      },
      ...messages.map(msg => ({
        role: (msg.isUser ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.text
      }))
    ];

    const startTime = performance.now();
    let firstTokenTime: number | null = null;
    let responseText = '';

    let modelMetrics: ModelMetrics = {
      timeToFirstToken: 0,
      completionTokens: 0,
      tokensPerSecond: 0
    };

    console.log('Beginning completion with the system prompt:', systemPrompt);

    if (streaming) {
      const result = await lm.complete({
        messages: formattedMessages,
        options: {
          maxTokens: maxTokens,
          stopSequences: stopWords,
        },
        onToken: (token: string) => {
          if (!firstTokenTime) {
            firstTokenTime = performance.now();
            modelMetrics.timeToFirstToken = firstTokenTime - startTime;
          }
          responseText += token;
          // if(!voiceMode) {
          //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          // }
          onProgress(token);
        }
      });

      modelMetrics.completionTokens = result.totalTokens || 0;
      modelMetrics.tokensPerSecond = result.tokensPerSecond || 0;
      onComplete(modelMetrics, model, responseText);
    } else {
      const result = await lm.complete({
        messages: formattedMessages,
        options: {
          maxTokens: 1024,
          stopSequences: stopWords,
        }
      });

      responseText = result.response || '';
      modelMetrics.completionTokens = result.totalTokens || 0;
      modelMetrics.tokensPerSecond = result.tokensPerSecond || 0;
      onProgress(responseText);
      onComplete(modelMetrics, model, responseText);
    }
  } catch (error) {
    console.error('Error during Llama completion:', error);
    throw error;
  }
}

/**
 * Generates message metadata for tracking and storage
 */
export function createMessageMetadata(isUser: boolean, model: CactusModel): Pick<Message, 'id' | 'isUser' | 'model'> {
  return {
    id: generateUniqueId(),
    isUser,
    model
  };
}

/**
 * Generate a unique ID for messages and conversations
 */
export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}