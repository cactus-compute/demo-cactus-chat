import { createContext, useEffect, useState, useContext, useRef } from 'react';
import { Platform } from 'react-native';
import { 
  Model, 
  InferenceHardware,
  fetchModelsAvailableToDownload, 
  ModelAvailableToDownload 
} from '@/services/models';
import { 
  getLocalModels,
  saveTokenGenerationLimit, 
  getTokenGenerationLimit, 
  saveLastUsedModel,
  getLastUsedModel, 
  getInferenceHardware, 
  saveInferenceHardware, 
  getIsReasoningEnabled, 
  saveIsReasoningEnabled,
  getFullModelPath
} from '@/services/storage';
import { initLlama, LlamaContext, releaseAllLlama } from 'cactus-react-native';
import { logModelLoadDiagnostics } from '@/services/diagnostics';
import { generateUniqueId } from '@/services/chat/llama-local';
import * as FileSystem from 'expo-file-system';

interface LoadedContext {
  context: LlamaContext | null,
  model: Model | null,
  inferenceHardware: InferenceHardware[]
}

interface ModelContextType {
    cactusContext: LoadedContext;
    isContextLoading: boolean;
    availableModels: Model[];
    selectedModel: Model | null;
    setSelectedModel: (model: Model | null) => void;
    refreshModels: () => void;
    tokenGenerationLimit: number;
    setTokenGenerationLimit: (limit: number) => void;
    inferenceHardware: InferenceHardware[];
    setInferenceHardware: (hardware: InferenceHardware[]) => void;
    isReasoningEnabled: boolean;
    setIsReasoningEnabled: (enabled: boolean) => void;
    conversationId: string;
    setConversationId: (id: string) => void;
    modelsAvailableToDownload: ModelAvailableToDownload[];
}

const ModelContext = createContext<ModelContextType>({
    cactusContext: {context: null, model: null, inferenceHardware: []},
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
});

export const ModelProvider = ({ children }: { children: React.ReactNode }) => {
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [modelsVersion, setModelsVersion] = useState<number>(0);
  const [tokenGenerationLimit, setTokenGenerationLimit] = useState<number>(1000);
  const [inferenceHardware, setInferenceHardware] = useState<InferenceHardware[]>(['cpu']);
  const [cactusContext, setCactusContext] = useState<LoadedContext>({context: null, model: null, inferenceHardware: []});
  const [isContextLoading, setIsContextLoading] = useState<boolean>(false);
  const [isReasoningEnabled, setIsReasoningEnabled] = useState<boolean>(true);
  const [conversationId, setConversationId] = useState<string>(generateUniqueId())
  const [modelsAvailableToDownload, setModelsAvailableToDownload] = useState<ModelAvailableToDownload[]>([]);

  const reloadLock = useRef(false);

  function refreshModels() {
    setModelsVersion(modelsVersion + 1);
  }

  useEffect(() => { // on initial load
    getTokenGenerationLimit().then((limit) => {
      setTokenGenerationLimit(limit);
    });
    getInferenceHardware().then((hardware) => {
      setInferenceHardware(hardware)
    });
    getIsReasoningEnabled().then((enabled) => {
      setIsReasoningEnabled(enabled)
    })
    getLocalModels().then((fetchedAvailableModels) => {
      setAvailableModels(availableModels);
      getLastUsedModel().then((lastUsedModel) => {
        setSelectedModel(availableModels.find(m => m.value === lastUsedModel) || fetchedAvailableModels[0]);
      });
    });
    fetchModelsAvailableToDownload().then((models) => {
      setModelsAvailableToDownload(models);
    });
  }, []);

  useEffect(() => {
    saveTokenGenerationLimit(tokenGenerationLimit);
  }, [tokenGenerationLimit]);

  useEffect(() => {
    saveInferenceHardware(inferenceHardware)
  }, [inferenceHardware])

  useEffect(() => {
    saveIsReasoningEnabled(isReasoningEnabled)
  }, [isReasoningEnabled])

  useEffect(() => {
    getLocalModels().then((models) => {
      setAvailableModels(models);
    });
  }, [modelsVersion])

  useEffect(() => {
    const reloadModelContext = async () => {
      if (selectedModel && !reloadLock.current){
        console.log('inside the function')
        setIsContextLoading(true);
        reloadLock.current = true;
        if (Platform.OS === 'ios'){
          await releaseAllLlama();
          console.log('released all llama')
        } else console.log('skipping llama release on Android')
        const modelPath = getFullModelPath(selectedModel.meta?.fileName || '');
        console.log(`Full model path: ${modelPath}`)
        const gpuLayers = Platform.OS === 'ios' && inferenceHardware.includes('gpu') ? 99 : 0
        const startTime = performance.now();
        console.log(await FileSystem.getInfoAsync(modelPath))
        const context = await initLlama({
          model: modelPath,
          use_mlock: true,
          n_ctx: 2048,
          n_gpu_layers: gpuLayers
        });
        console.log('initialized llama')
        const endTime = performance.now();
        logModelLoadDiagnostics({model: selectedModel.value, loadTime: endTime - startTime});
        setCactusContext({
          context: context,
          model: selectedModel,
          inferenceHardware: inferenceHardware
        })
        setIsContextLoading(false)
        saveLastUsedModel(selectedModel.value);
        reloadLock.current = false;
      }
    }
    reloadModelContext()
    console.log('triggering reload of context!')
  }, [selectedModel, inferenceHardware])

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
    modelsAvailableToDownload 
  }}>
    {children}
  </ModelContext.Provider>
  )
};

export const useModelContext = () => {
    const context = useContext(ModelContext);
    if (context === undefined || context === null) {
      throw new Error('useModelContext must be used within an ModelProvider');
    }
    return context;
};