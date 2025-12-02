import { getApiKey } from '../storage';
import { ModelMetrics } from '../../utils/modelMetrics';
import EventSource from 'react-native-sse';
import { Message } from '../../components/ui/chat/ChatMessage';
import { ChatCompleteCallback, ChatProgressCallback } from './chat';
import { CactusModel } from '../models';

export async function streamOpenAICompletion(
  messages: Message[],
  model: CactusModel,
  onProgress: ChatProgressCallback,
  onComplete: ChatCompleteCallback,
  streaming: boolean = true,
  maxTokens: number
) {
  try {
    const apiKey = await getApiKey('OpenAI');
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please add your API key in settings.');
    }

    const formattedMessages = [
      { role: 'system' as const, content: 'You are a helpful AI assistant called ChatGPT.' },
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
        messages: formattedMessages,
        stream: true,
        max_tokens: maxTokens,
        stream_options: { include_usage: true }
      }

      const es = new EventSource('https://api.openai.com/v1/chat/completions', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(payload),
        pollingInterval: 0
      })

      let responseText = '';

      const listener = (event: any) => {
        if (event.type === 'open') {
          console.log('Open SSE connection.')
        } else if (event.type === 'message') {
          if (event.data !== '[DONE]') {
            const data = JSON.parse(event.data)
            const delta = data.choices[0]?.delta

            if (delta?.content) {
              if (!firstTokenTime) {
                firstTokenTime = performance.now();
                modelMetrics.timeToFirstToken = firstTokenTime - startTime;
                console.log('Start time', startTime);
                console.log('First token time', firstTokenTime);
                console.log('Time to first token', modelMetrics.timeToFirstToken);
              }
              responseText += delta.content
              onProgress(responseText)
            }

            if (data.usage) {
              const endTime = performance.now();
              const totalTime = endTime - startTime;

              modelMetrics.completionTokens = data.usage.completion_tokens;
              modelMetrics.tokensPerSecond = modelMetrics.completionTokens / (totalTime / 1000);
              console.log('Model metrics', modelMetrics);
            }

          } else {
            console.log('Done. SSE connection closed.')
            es.close()
            onComplete(modelMetrics, model, responseText)
          }
        } else if (event.type === 'error') {
          console.error('Connection error:', event.message)
        } else if (event.type === 'exception') {
          console.error('Error:', event.message, event.error)
        } else if (event.type === 'close') {
          console.log('Close SSE connection.')
          // onComplete(responseText)
        }
        
      }

      es.addEventListener('open', listener)
      es.addEventListener('message', listener)
      es.addEventListener('error', listener)
      es.addEventListener('close', listener)
    }
  } catch (error) {
    console.error('Error during chat completion:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
} 