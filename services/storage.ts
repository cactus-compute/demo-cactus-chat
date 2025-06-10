import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '@/components/ui/chat/ChatMessage';
import { Model, ModelAvailableToDownload } from '@/services/models';
import * as FileSystem from 'expo-file-system';
import { Provider } from '@/services/models';
import { supabase } from '@/services/supabase';
import { Platform } from 'react-native';
import { getBrand, getModel, getSystemVersion } from 'react-native-device-info';

// Keys for AsyncStorage
const STORAGE_KEY = '@cactus_conversations';
const LAST_MODEL_KEY = '@last_used_model';
const DEVICE_ID_KEY = '@device_id';
const TOKEN_GENERATION_LIMIT_KEY = '@token_generation_limit';
const INFERENCE_HARDWARE_KEY = '@inference_hardware';
const MODELS_AVAILABLE_TO_DOWNLOAD_KEY = '@models_available_to_download';
const IS_REASONING_ENABLED_KEY = '@is_reasoning_enabled';
const LANGUAGE_PREFERENCE_KEY = '@language_preference';

export const getTokenGenerationLimit = async (): Promise<number> => {
  const limit = await AsyncStorage.getItem(TOKEN_GENERATION_LIMIT_KEY);
  return limit ? parseInt(limit) : 1000;
}

export const saveTokenGenerationLimit = async (limit: number) => {
  await AsyncStorage.setItem(TOKEN_GENERATION_LIMIT_KEY, limit.toString());
}

export const getInferenceHardware = async (): Promise<string[]> => {
  const hardware = await AsyncStorage.getItem(INFERENCE_HARDWARE_KEY);
  return hardware ? JSON.parse(hardware) : ['cpu'];
}

export const saveInferenceHardware = async (hardware: string[]) => {
  const jsonValue = JSON.stringify(hardware);
  await AsyncStorage.setItem(INFERENCE_HARDWARE_KEY, jsonValue);
}

export const getIsReasoningEnabled = async (): Promise<boolean> => {
  const enabled = await AsyncStorage.getItem(IS_REASONING_ENABLED_KEY);
  return enabled ? enabled === 'true' : false
}

export const saveIsReasoningEnabled = async (enabled: boolean) => {
  await AsyncStorage.setItem(IS_REASONING_ENABLED_KEY, enabled.toString());
} 

export const getModelDirectory = () => 
  Platform.OS === 'ios' 
    ? `${FileSystem.documentDirectory}local-models/`
    : `${FileSystem.cacheDirectory}local-models/`;

export const getFullModelPath = (fileName: string) => 
  `${getModelDirectory()}${fileName}`;

interface RegisterDeviceResponse {
  success: boolean;
  deviceId: string | null;
}

export async function registerDevice(): Promise<RegisterDeviceResponse> {
  const { data, error } = await supabase.from('devices').insert({
      brand: getBrand(),
      model: getModel(),
      os_version: getSystemVersion(),
  }).select()
  if (error) {
      return { success: false, deviceId: null };
  }
  return { success: true, deviceId: data?.[0]?.id.toString() };
}

// Conversation structure
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
  model: Model;
}

// Store structure - a simple dictionary of conversations by ID
interface ConversationsStore {
  [id: string]: Conversation;
}

async function registerDeviceIfNotRegistered(): Promise<string | null> {
  const {success, deviceId} = await registerDevice();
  if (success && deviceId) {
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  }
  return null;
}

export async function getDeviceId(): Promise<number | null> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    console.log('No device id found, registering device')
    deviceId = await registerDeviceIfNotRegistered();
    console.log('Device id registered', deviceId);
  }
  return parseInt(deviceId || '0');
}

// Save a single conversation
export async function saveConversation(conversation: Conversation): Promise<void> {
  try {
    // Get existing data
    const existingData = await AsyncStorage.getItem(STORAGE_KEY);
    const conversations: ConversationsStore = existingData ? JSON.parse(existingData) : {};
    
    // Add or update conversation
    conversations[conversation.id] = conversation;
    
    // Save back to storage
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}

// Get all conversations
export async function getConversations(): Promise<Conversation[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const conversations: ConversationsStore = data ? JSON.parse(data) : {};
    return Object.values(conversations).sort((a, b) => b.lastUpdated - a.lastUpdated);
  } catch (error) {
    console.error('Error loading conversations:', error);
    return [];
  }
}

// Get a single conversation
export async function getConversation(id: string): Promise<Conversation | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const conversations: ConversationsStore = data ? JSON.parse(data) : {};
    return conversations[id] || null;
  } catch (error) {
    console.error('Error loading conversation:', error);
    return null;
  }
}

// Delete a conversation
export async function deleteConversation(id: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const conversations: ConversationsStore = data ? JSON.parse(data) : {};
    
    if (conversations[id]) {
      delete conversations[id];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
  }
}

// Save the last used model ID
export async function saveLastUsedModel(modelId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_MODEL_KEY, modelId);
  } catch (error) {
    console.error('Error saving last model:', error);
  }
}

// Get the last used model ID
export async function getLastUsedModel(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_MODEL_KEY);
  } catch (error) {
    console.error('Error loading last model:', error);
    return null;
  }
}

function fetchProviderKeyStoreName(provider: Provider): string {
  return `@cactus_${provider.toLowerCase()}_api_key`;
}

export async function saveApiKey(provider: Provider, key: string): Promise<void> {
  try {
    await AsyncStorage.setItem(fetchProviderKeyStoreName(provider), key);
    console.log(`${provider} key saved`);
  } catch (error) {
    console.error(`Error saving ${provider} key:`, error);
  }
}

// export async function getApiKey(provider: Provider): Promise<string | null> {
//   try {
//     return await AsyncStorage.getItem(fetchProviderKeyStoreName(provider));
//   } catch (error) {
//     console.error(`Error loading ${provider} key:`, error);
//     return null;
//   }
// }

// export async function deleteApiKey(provider: Provider): Promise<void> {
//   try {
//     await AsyncStorage.removeItem(fetchProviderKeyStoreName(provider));
//   } catch (error) {
//     console.error(`Error deleting ${provider} key:`, error);
//   }
// }

export const storeLocalModel = (model: Model) => 
  AsyncStorage.setItem(`local_model_${model.value}`, JSON.stringify(model));

export const getLocalModels = async (): Promise<Model[]> => {
  const keys = await AsyncStorage.getAllKeys();
  const models = await AsyncStorage.multiGet(keys.filter(k => k.startsWith('local_model_')));
  return models.map(([_, val]) => JSON.parse(val as string) as Model);
};

export const removeLocalModel = async (id: string) => {
  const localModel = await AsyncStorage.getItem(`local_model_${id}`);
  if (localModel) {
    const model = JSON.parse(localModel) as Model;
    await FileSystem.deleteAsync(getFullModelPath(model.meta?.fileName || ''));
    await AsyncStorage.removeItem(`local_model_${id}`);
  }
}

export const getModelsAvailableToDownload = async (): Promise<ModelAvailableToDownload[]> => {
  const data = await AsyncStorage.getItem(MODELS_AVAILABLE_TO_DOWNLOAD_KEY);
  return data ? JSON.parse(data) : [];
}

export const saveModelsAvailableToDownload = async (models: ModelAvailableToDownload[]) => {
  await AsyncStorage.setItem(MODELS_AVAILABLE_TO_DOWNLOAD_KEY, JSON.stringify(models));
}

export const getLanguagePreference = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(LANGUAGE_PREFERENCE_KEY);
}

export const saveLanguagePreference = async (language: string) => {
  await AsyncStorage.setItem(LANGUAGE_PREFERENCE_KEY, language);
}