import { getApiKey } from '../storage';
import { Message } from '@/components/ui/chat/ChatMessage';
import { ModelMetrics } from '@/utils/modelMetrics';
import EventSource from 'react-native-sse';
import { ChatCompleteCallback, ChatProgressCallback } from './chat';
import { CactusModel } from '../models';

export async function streamGeminiCompletion(
  messages: Message[],
  model: CactusModel,
  onProgress: ChatProgressCallback,
  onComplete: ChatCompleteCallback,
  streaming: boolean = true,
  maxTokens: number
) {
  try {
    const apiKey = await getApiKey('Google');
    if (!apiKey) {
      throw new Error('Gemini API key not found. Please add your API key in settings.');
    }

    const formattedMessages = messages.map(msg => ({
      parts: [{ text: msg.text }],
      role: msg.isUser ? 'user' : 'model'
    }));

    const startTime = performance.now();
    let firstTokenTime: number | null = null;
    let responseText: string = '';

    let modelMetrics: ModelMetrics = {
      timeToFirstToken: 0,
      completionTokens: 0,
      tokensPerSecond: 0
    }

    if (streaming) {
      const payload = {
        contents: formattedMessages,
        generationConfig: {
            maxOutputTokens: maxTokens
        }
      }

      // We've already checked apiKey is not null above
      const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${model.slug}:streamGenerateContent?key=${apiKey}`);
      url.searchParams.append('alt', 'sse');
      
      const es = new EventSource(url.toString(), {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(payload),
        pollingInterval: 0
      });

      const eventHandlers: { [key: string]: (event: any) => void } = {
        message: (event) => {
          const data = JSON.parse(event.data);
            if (data.candidates) {
                if (data.candidates[0]?.content?.parts) {
                const textChunk = data.candidates[0].content.parts[0].text || '';
                    
                if (!firstTokenTime && textChunk) {
                    firstTokenTime = performance.now();
                    modelMetrics.timeToFirstToken = firstTokenTime - startTime;
                }
                
                responseText += textChunk;
                onProgress(responseText);
                
                if (data.usageMetadata) {
                    //
                }

                if (data.candidates[0]?.finishReason === 'STOP' || data.candidates[0]?.finishReason === 'MAX_TOKENS') {
                    const endTime = performance.now();
                    const totalTime = endTime - startTime;

                    modelMetrics.completionTokens = data.usageMetadata.candidatesTokenCount
                    modelMetrics.tokensPerSecond = modelMetrics.completionTokens / (totalTime / 1000);

                    onComplete(modelMetrics, model, responseText);
                    es.close();
                }
            }
          }
        },
      };

      Object.keys(eventHandlers).forEach((eventType) => {
        es.addEventListener(eventType as any, eventHandlers[eventType]);
      });

    //   es.addEventListener('message', (event) => {
    //     try {
    //       const data = JSON.parse(event.data);
          
    //       if (data.candidates && data.candidates[0]?.content?.parts) {
    //         const textChunk = data.candidates[0].content.parts[0].text || '';
            
    //         if (!firstTokenTime && textChunk) {
    //           firstTokenTime = performance.now();
    //           modelMetrics.timeToFirstToken = firstTokenTime - startTime;
    //         }
            
    //         responseText += textChunk;
    //         onProgress(responseText);
            
    //         // Update token metrics if available
    //         if (data.usageMetadata) {
    //           modelMetrics.completionTokens = data.usageMetadata.totalTokenCount || 0;
    //         }
    //       }
    //     } catch (error: any) {
    //       console.error(`Error parsing SSE data: ${error.message}`);
    //     }
    //   });

    //   // Use 'end' or 'close' event instead of 'done'
    //   es.addEventListener('close', () => {
    //     const endTime = performance.now();
    //     const totalTime = endTime - startTime;
        
    //     if (modelMetrics.completionTokens > 0 && totalTime > 0) {
    //       modelMetrics.tokensPerSecond = modelMetrics.completionTokens / (totalTime / 1000);
    //     }
        
    //     onComplete(modelMetrics);
    //     es.close();
    //   });

    //   es.addEventListener('error', (error) => {
    //     console.error('SSE Error:', error);
    //     es.close();
    //   });
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
