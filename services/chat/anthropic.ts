import { getApiKey } from '../storage';
import { Message } from '@/components/ui/chat/ChatMessage';
import { ModelMetrics } from '@/utils/modelMetrics';
import EventSource from 'react-native-sse';
import { ChatCompleteCallback, ChatProgressCallback } from './chat';
import { CactusModel } from '../models';

export async function streamAnthropicCompletion(
  messages: Message[],
  model: CactusModel,
  onProgress: ChatProgressCallback,
  onComplete: ChatCompleteCallback,
  streaming: boolean = true,
  maxTokens: number
) {
  try {
    const apiKey = await getApiKey('Anthropic');
    if (!apiKey) {
      throw new Error('Anthropic API key not found. Please add your API key in settings.');
    }

    const formattedMessages = [
      ...messages.map(msg => ({
        role: msg.isUser ? 'user' as const : 'assistant' as const,
        content: msg.text
      }))
    ]

    const startTime = performance.now();
    let firstTokenTime: number | null = null;

    let modelMetrics: ModelMetrics = {
      timeToFirstToken: 0,
      completionTokens: 0,
      tokensPerSecond: 0
    }

    if (streaming) {

      const payload = {
        model: model.slug,
        max_tokens: maxTokens,
        messages: formattedMessages,
        stream: true,
      }
      const es = new EventSource('https://api.anthropic.com/v1/messages', {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(payload),
        pollingInterval: 0
      })

      let responseText: string = '';

      const eventHandlers: { [key: string]: (event: any) => void } = {
        content_block_delta: (event) => {
          try {
            const data = JSON.parse(event.data);
            const delta = data.delta
            if (delta?.text) {
              if (!firstTokenTime) {
                firstTokenTime = performance.now();
                modelMetrics.timeToFirstToken = firstTokenTime - startTime;
              }
              responseText += delta?.text;
              onProgress(responseText);
            }
          } catch (error: any) {
            console.error(`JSON Parse on ${event.data} with error ${error.message}`);
            es.close();
          }
        },
        message_stop: (event) => {
          onComplete(modelMetrics, model, responseText);
          es.close();
        },
        message_delta: (event) => {
          const data = JSON.parse(event.data);  
          const endTime = performance.now();
          const totalTime = endTime - startTime;

          modelMetrics.completionTokens = data.usage.output_tokens;
          modelMetrics.tokensPerSecond = modelMetrics.completionTokens / (totalTime / 1000);
        },
        message_start: (event) => {
          console.log('Message start', event.data);
        },
        content_block_stop: (event) => {
          console.log('Content block stop', event.data);
        },
        error: (event) => {
          console.log('Error', event.message);
          es.close();
        },
      };

      Object.keys(eventHandlers).forEach((eventType) => {
        es.addEventListener(eventType as any, eventHandlers[eventType]);
      });
    }

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}