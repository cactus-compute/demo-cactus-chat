import { streamOpenAICompletion } from './openai';
import { streamAnthropicCompletion } from './anthropic';
import { streamGeminiCompletion } from './gemini';
import { streamLlamaCompletion } from './llama-local';
import { Message } from '@/components/ui/chat/ChatMessage';
import { CactusModel } from '../models';
import { ModelMetrics } from '@/utils/modelMetrics';

export interface ChatProgressCallback {
  (text: string): void;
}

export interface ChatCompleteCallback {
  (metrics: ModelMetrics, model: CactusModel, completeMessage: string): void;
}

export interface ChatOptions {
  streaming?: boolean;
  voiceMode?: boolean; // only used by Llama local
  isReasoningEnabled?: boolean;
}

/**
 * Unified chat service that handles all providers
 */
export async function sendChatMessage(
  messages: Message[],
  model: CactusModel,
  onProgress: ChatProgressCallback,
  onComplete: ChatCompleteCallback,
  options: ChatOptions = { streaming: true, voiceMode: false },
  maxTokens: number
): Promise<void> {
  try {
    // switch (model.provider) {
    //   case 'OpenAI':
    //     return await streamOpenAICompletion(
    //       messages, 
    //       model, 
    //       onProgress, 
    //       onComplete, 
    //       options.streaming,
    //       maxTokens,
    //     );
        
    //   case 'Anthropic':
    //     return await streamAnthropicCompletion(
    //       messages, 
    //       model, 
    //       onProgress, 
    //       onComplete, 
    //       options.streaming,
    //       maxTokens,
    //     );
        
    //   case 'Google':
    //     return await streamGeminiCompletion(
    //       messages, 
    //       model, 
    //       onProgress, 
    //       onComplete, 
    //       options.streaming,
    //       maxTokens,
    //     );
        
    //   case 'Cactus':
      return await streamLlamaCompletion(
        messages, 
        model, 
        onProgress, 
        onComplete, 
        options.streaming,
        maxTokens,
        options.voiceMode
      );
        
      // default:
      //   throw new Error(`Unknown provider: ${model.provider}`);
    // }
  } catch (error) {
    console.error(`Chat service error with ${model.name}:`, error);
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