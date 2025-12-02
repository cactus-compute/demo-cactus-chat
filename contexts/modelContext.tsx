import { createContext, useEffect, useState, useContext, useRef } from 'react';
import {
  CactusModel,
  InferenceHardware
} from '@/services/models';
import {
  saveTokenGenerationLimit,
  getTokenGenerationLimit,
  saveLastUsedModel,
  getLastUsedModel,
  getInferenceHardware,
  saveInferenceHardware,
  getIsReasoningEnabled,
  saveIsReasoningEnabled,
  getSystemPrompt,
  saveSystemPrompt
} from '@/services/storage';
import { useCactusLM } from 'cactus-react-native';
import { logModelLoadDiagnostics } from '@/services/diagnostics';
import { generateUniqueId } from '@/services/chat/llama-local';

interface LoadedContext {
  lm: ReturnType<typeof useCactusLM> | null,
  model: CactusModel | null,
  inferenceHardware: InferenceHardware[]
}

interface ModelContextType {
    cactusContext: LoadedContext;
    isContextLoading: boolean;
    availableModels: CactusModel[];
    selectedModel: CactusModel | null;
    setSelectedModel: (model: CactusModel | null) => void;
    refreshModels: () => void;
    tokenGenerationLimit: number;
    setTokenGenerationLimit: (limit: number) => void;
    inferenceHardware: InferenceHardware[];
    setInferenceHardware: (hardware: InferenceHardware[]) => void;
    isReasoningEnabled: boolean;
    setIsReasoningEnabled: (enabled: boolean) => void;
    conversationId: string;
    setConversationId: (id: string) => void;
    modelsAvailableToDownload: CactusModel[];
    systemPrompt: string;
    setSystemPrompt: (prompt: string) => void;
    hasOpenAIKey: boolean;
    hasAnthropicKey: boolean;
    hasGeminiKey: boolean;
}

const ModelContext = createContext<ModelContextType>({
    cactusContext: {lm: null, model: null, inferenceHardware: []},
    isContextLoading: false,
    availableModels: [],
    selectedModel: null,
    setSelectedModel: () => {},
    refreshModels: () => {},
    tokenGenerationLimit: 1000,
    setTokenGenerationLimit: () => {},
    inferenceHardware: ['cpu'],
    setInferenceHardware: () => {},
    isReasoningEnabled: true,
    setIsReasoningEnabled: () => {},
    conversationId: generateUniqueId(),
    setConversationId: () => {},
    modelsAvailableToDownload: [],
    systemPrompt: '',
    setSystemPrompt: () => {},
    hasOpenAIKey: false,
    hasAnthropicKey: false,
    hasGeminiKey: false,
});

export const ModelProvider = ({ children }: { children: React.ReactNode }) => {
  // App-specific state
  const [availableModels, setAvailableModels] = useState<CactusModel[]>([]);
  const [modelsAvailableToDownload, setModelsAvailableToDownload] = useState<CactusModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<CactusModel | null>(null);

  // Use the hook for CactusLM management (with selected model)
  const cactusLM = useCactusLM({
    model: selectedModel?.slug,
    contextSize: 2048
  });
  const [tokenGenerationLimit, setTokenGenerationLimit] = useState<number>(1000);
  const [inferenceHardware, setInferenceHardware] = useState<InferenceHardware[]>(['cpu']);
  const [isReasoningEnabled, setIsReasoningEnabled] = useState<boolean>(true);
  const [conversationId, setConversationId] = useState<string>(generateUniqueId());
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [hasOpenAIKey, setHasOpenAIKey] = useState<boolean>(false);
  const [hasAnthropicKey, setHasAnthropicKey] = useState<boolean>(false);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);

  const [modelsRefreshTrigger, setModelsRefreshTrigger] = useState<number>(0);

  function refreshModels() {
    setModelsRefreshTrigger(prev => prev + 1);
  }

  // Load app settings on mount
  useEffect(() => {
    getTokenGenerationLimit().then(setTokenGenerationLimit);
    getInferenceHardware().then(setInferenceHardware);
    getIsReasoningEnabled().then(setIsReasoningEnabled);
    getSystemPrompt().then(setSystemPrompt);
  }, []);

  // Save app settings when they change
  useEffect(() => {
    saveTokenGenerationLimit(tokenGenerationLimit);
  }, [tokenGenerationLimit]);

  useEffect(() => {
    saveInferenceHardware(inferenceHardware);
  }, [inferenceHardware]);

  useEffect(() => {
    saveIsReasoningEnabled(isReasoningEnabled);
  }, [isReasoningEnabled]);

  useEffect(() => {
    saveSystemPrompt(systemPrompt);
  }, [systemPrompt]);

  // Fetch models from SDK
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const models = await cactusLM.getModels();
        const downloaded = models.filter(m => m.isDownloaded);
        const notDownloaded = models.filter(m => !m.isDownloaded);

        setAvailableModels(downloaded);
        setModelsAvailableToDownload(notDownloaded);

        // Select last used model or first available
        if (downloaded.length > 0 && !selectedModel) {
          const lastUsedSlug = await getLastUsedModel();
          const modelToSelect = downloaded.find(m => m.slug === lastUsedSlug) || downloaded[0];
          setSelectedModel(modelToSelect);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }
    };

    fetchModels();
  }, [modelsRefreshTrigger]);

  // Save last used model when selection changes
  useEffect(() => {
    if (selectedModel) {
      saveLastUsedModel(selectedModel.slug);
      console.log(`Model selected: ${selectedModel.slug}`);
    }
  }, [selectedModel])

  // Construct context value
  const cactusContext: LoadedContext = {
    lm: cactusLM,
    model: selectedModel,
    inferenceHardware
  };

  const isContextLoading = cactusLM.isInitializing || cactusLM.isDownloading;

  return (
    <ModelContext.Provider value={{
      cactusContext,
      isContextLoading,
      availableModels,
      selectedModel,
      setSelectedModel,
      refreshModels,
      tokenGenerationLimit,
      setTokenGenerationLimit,
      inferenceHardware,
      setInferenceHardware,
      isReasoningEnabled,
      setIsReasoningEnabled,
      conversationId,
      setConversationId,
      modelsAvailableToDownload,
      systemPrompt,
      setSystemPrompt,
      hasOpenAIKey,
      hasAnthropicKey,
      hasGeminiKey,
    }}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModelContext = () => {
    const context = useContext(ModelContext);
    if (context === undefined || context === null) {
      throw new Error('useModelContext must be used within an ModelProvider');
    }
    return context;
};