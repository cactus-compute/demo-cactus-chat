import { Message } from '@/components/ui/chat/ChatMessage';
import { ModelMetrics } from '@/utils/modelMetrics';
import { Model } from '../models';
import { LlamaContext } from 'cactus-react-native';
import * as Haptics from 'expo-haptics';

export interface ChatProgressCallback {
  (text: string): void;
}

export interface ChatCompleteCallback {
  (metrics: ModelMetrics, model: Model, completeMessage: string): void;
}

/**
 * Initialize the conversation context with system message for v0.1.4
 */
export async function initializeConversationContext(
  context: LlamaContext,
  voiceMode?: boolean
): Promise<void> {
  const systemMessage = {
    role: 'system',
    content: `You are Cactus, a very capable AI assistant running offline on a smartphone. ${voiceMode ? 'Keep your messages VERY short. One-two sentences max.' : ''}`
  };
  
  // Initialize context with system message
  await context.completion({
    messages: [systemMessage],
    n_predict: 1, // Minimal prediction just to set the system message
    stop: ['</s>']
  });
}

/**
 * Load existing conversation into context for v0.1.4
 */
export async function loadConversationIntoContext(
  context: LlamaContext,
  messages: Message[],
  voiceMode?: boolean
): Promise<void> {
  if (messages.length === 0) {
    // If no messages, just initialize with system message
    await initializeConversationContext(context, voiceMode);
    return;
  }
  
  if (context.stopCompletion) await context.stopCompletion();
  await Promise.race([context.rewind(), new Promise((_, reject) => setTimeout(reject, 3000))]);
  
  // Format all messages including system message
  const systemMessage = {
    role: 'system',
    content: `You are Cactus, a very capable AI assistant running offline on a smartphone. ${voiceMode ? 'Keep your messages VERY short. One-two sentences max.' : ''}`
  };
  
  const formattedMessages = [
    systemMessage,
    ...messages.map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text
    }))
  ];
  
  // Load all messages in one call to restore conversation context
  await context.completion({
    messages: formattedMessages,
    n_predict: 1, // Minimal prediction just to load the context
    stop: ['</s>']
  });
}

export async function streamLlamaCompletion(
  context: LlamaContext | null,
  messages: Message[],
  model: Model,
  onProgress: ChatProgressCallback,
  onComplete: ChatCompleteCallback,
  streaming: boolean = true,
  maxTokens: number,
  isReasoningEnabled: boolean,
  voiceMode?: boolean,
  isFirstMessage?: boolean
) {
  try {
    console.log('Ensuring Llama context...', new Date().toISOString());
    if (!context) {
      throw new Error('Failed to initialize Llama context');
    }
    console.log('Llama context initialized', new Date().toISOString());
    
    const stopWords = ['</s>', '<|end|>', '<|eot_id|>', '<|end_of_text|>', 
                       '<|im_end|>', '<|EOT|>', '<|END_OF_TURN_TOKEN|>', 
                       '<|end_of_turn|>', '<|endoftext|>', '<end_of_turn>', '<|end_of_sentence|>'];
    
    // In v0.1.4, the context maintains its own message history
    // So we only need to pass the latest message
    const latestMessage = messages[messages.length - 1];
    const formattedLatestMessage = {
      role: latestMessage.isUser ? 'user' : 'assistant',
      content: latestMessage.text
    };
    
    const startTime = performance.now();
    let firstTokenTime: number | null = null;
    let responseText = '';
    
    let modelMetrics: ModelMetrics = {
      timeToFirstToken: 0,
      completionTokens: 0,
      tokensPerSecond: 0
    };
    
    if (streaming) {
      const result = await context.completion(
        {
          messages: [formattedLatestMessage], // Only pass the latest message
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
      const result = await context.completion({
        messages: [formattedLatestMessage],
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