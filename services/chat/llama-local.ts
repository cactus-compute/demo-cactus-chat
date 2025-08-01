import { Message } from '@/components/ui/chat/ChatMessage';
import { ModelMetrics } from '@/utils/modelMetrics';
import { Model } from '../models';
import { CactusLM } from 'cactus-react-native';
import * as Haptics from 'expo-haptics';

export interface ChatProgressCallback {
  (text: string): void;
}

export interface ChatCompleteCallback {
  (metrics: ModelMetrics, model: Model, completeMessage: string): void;
}

export async function streamLlamaCompletion(
  lm: CactusLM | null,
  messages: Message[],
  model: Model,
  onProgress: ChatProgressCallback,
  onComplete: ChatCompleteCallback,
  streaming: boolean = true,
  maxTokens: number,
  isReasoningEnabled: boolean,
  voiceMode?: boolean
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
    
    const formattedMessages = [
      {
        role: 'system',
        content: `You are Cactus, a very capable AI assistant running offline on a smartphone. ${voiceMode ? 'Keep your messages VERY short. One-two sentences max.' : ''}`
      },
      ...messages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
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
    
    if (streaming) {
      const result = await lm.completion(
        formattedMessages,
        {
          n_predict: maxTokens,
          stop: stopWords,
        },
        (data: any) => {
          if (data.token) {
            if (!firstTokenTime) {
              firstTokenTime = performance.now();
              modelMetrics.timeToFirstToken = firstTokenTime - startTime;
            }
            responseText += data.token;
            if(!voiceMode) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
            onProgress(responseText);
          }
        }
      );
      
      modelMetrics.completionTokens = result.timings?.predicted_n
      modelMetrics.tokensPerSecond = result.timings?.predicted_per_second
      onComplete(modelMetrics, model, responseText);
    } else {
      const result = await lm.completion(
        formattedMessages,
        {
        n_predict: 1024,
        stop: stopWords,
      });
      
      responseText = result.text;
      modelMetrics.completionTokens = result.timings?.predicted_n
      modelMetrics.tokensPerSecond = result.timings?.predicted_per_second
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
export function createMessageMetadata(isUser: boolean, model: Model): Pick<Message, 'id' | 'isUser' | 'model'> {
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