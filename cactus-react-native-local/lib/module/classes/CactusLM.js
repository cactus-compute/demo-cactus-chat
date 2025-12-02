"use strict";

import { Cactus, CactusFileSystem } from "../native/index.js";
import { Telemetry } from "../telemetry/Telemetry.js";
import { CactusConfig } from "../config/CactusConfig.js";
import { Database } from "../api/Database.js";
import { getErrorMessage } from "../utils/error.js";
export class CactusLM {
  cactus = new Cactus();
  isDownloading = false;
  isInitialized = false;
  isGenerating = false;
  static defaultModel = 'qwen3-0.6';
  static defaultContextSize = 2048;
  static defaultCompleteOptions = {
    maxTokens: 512
  };
  static defaultEmbedBufferSize = 2048;
  static modelsInfoPath = 'models/info.json';
  constructor({
    model,
    contextSize
  } = {}) {
    this.model = model ?? CactusLM.defaultModel;
    this.contextSize = contextSize ?? CactusLM.defaultContextSize;
  }
  async download({
    onProgress
  } = {}) {
    if (this.isDownloading) {
      throw new Error('CactusLM is already downloading');
    }
    if (await CactusFileSystem.modelExists(this.model)) {
      onProgress?.(1.0);
      return;
    }
    this.isDownloading = true;
    try {
      await CactusFileSystem.downloadModel(this.model, onProgress);
      await this.getModels({
        forceRefresh: true
      });
    } finally {
      this.isDownloading = false;
    }
  }
  async init() {
    if (this.isInitialized) {
      return;
    }
    if (!Telemetry.isInitialized()) {
      await Telemetry.init(CactusConfig.telemetryToken);
    }
    if (!(await CactusFileSystem.modelExists(this.model))) {
      throw new Error(`Model "${this.model}" is not downloaded`);
    }
    const modelPath = await CactusFileSystem.getModelPath(this.model);
    try {
      await this.cactus.init(modelPath, this.contextSize);
      Telemetry.logInit(this.model, true);
      this.isInitialized = true;
    } catch (error) {
      Telemetry.logInit(this.model, false, getErrorMessage(error));
      throw error;
    }
  }
  async complete({
    messages,
    options,
    tools,
    onToken
  }) {
    if (this.isGenerating) {
      throw new Error('CactusLM is already generating');
    }
    await this.init();
    options = {
      ...CactusLM.defaultCompleteOptions,
      ...options
    };
    const responseBufferSize = 8 * (options.maxTokens ?? CactusLM.defaultCompleteOptions.maxTokens) + 256;
    this.isGenerating = true;
    try {
      const result = await this.cactus.complete(messages, responseBufferSize, options, tools, onToken);
      Telemetry.logCompletion(this.model, result.success, result.success ? undefined : result.response, result);
      return result;
    } catch (error) {
      Telemetry.logCompletion(this.model, false, getErrorMessage(error));
      throw error;
    } finally {
      this.isGenerating = false;
    }
  }
  async embed({
    text
  }) {
    if (this.isGenerating) {
      throw new Error('CactusLM is already generating');
    }
    await this.init();
    this.isGenerating = true;
    try {
      const embedding = await this.cactus.embed(text, CactusLM.defaultEmbedBufferSize);
      Telemetry.logEmbedding(this.model, true);
      return {
        embedding
      };
    } catch (error) {
      Telemetry.logEmbedding(this.model, false, getErrorMessage(error));
      throw error;
    } finally {
      this.isGenerating = false;
    }
  }
  stop() {
    return this.cactus.stop();
  }
  async reset() {
    await this.stop();
    return this.cactus.reset();
  }
  async destroy() {
    if (!this.isInitialized) {
      return;
    }
    await this.stop();
    await this.cactus.destroy();
    this.isInitialized = false;
  }
  async getModels({
    forceRefresh = false
  } = {}) {
    if (!forceRefresh && (await CactusFileSystem.fileExists(CactusLM.modelsInfoPath))) {
      try {
        return JSON.parse(await CactusFileSystem.readFile(CactusLM.modelsInfoPath));
      } catch {
        // Delete corrupted models info
        await CactusFileSystem.deleteFile(CactusLM.modelsInfoPath);
      }
    }
    const models = await Database.getModels();
    for (const model of models) {
      model.isDownloaded = await CactusFileSystem.modelExists(model.slug);
    }
    await CactusFileSystem.writeFile(CactusLM.modelsInfoPath, JSON.stringify(models));
    return models;
  }
}
//# sourceMappingURL=CactusLM.js.map