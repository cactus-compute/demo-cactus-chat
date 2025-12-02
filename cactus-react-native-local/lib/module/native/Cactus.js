"use strict";

import { NitroModules } from 'react-native-nitro-modules';
export class Cactus {
  hybridCactus = NitroModules.createHybridObject('Cactus');
  init(modelPath, contextSize) {
    return this.hybridCactus.init(modelPath, contextSize);
  }
  async complete(messages, responseBufferSize, options, tools, callback) {
    const messagesJson = JSON.stringify(messages);
    const optionsJson = options ? JSON.stringify({
      temperature: options.temperature,
      top_p: options.topP,
      top_k: options.topK,
      max_tokens: options.maxTokens,
      stop_sequences: options.stopSequences
    }) : undefined;
    const toolsJson = JSON.stringify(tools);
    const response = await this.hybridCactus.complete(messagesJson, responseBufferSize, optionsJson, toolsJson, callback);
    try {
      const parsed = JSON.parse(response);
      return {
        success: parsed.success,
        response: parsed.response,
        functionCalls: parsed.function_calls,
        timeToFirstTokenMs: parsed.time_to_first_token_ms,
        totalTimeMs: parsed.total_time_ms,
        tokensPerSecond: parsed.tokens_per_second,
        prefillTokens: parsed.prefill_tokens,
        decodeTokens: parsed.decode_tokens,
        totalTokens: parsed.total_tokens
      };
    } catch {
      throw new Error('Unable to parse completion response');
    }
  }
  embed(text, embeddingBufferSize) {
    return this.hybridCactus.embed(text, embeddingBufferSize);
  }
  reset() {
    return this.hybridCactus.reset();
  }
  stop() {
    return this.hybridCactus.stop();
  }
  destroy() {
    return this.hybridCactus.destroy();
  }
}
//# sourceMappingURL=Cactus.js.map