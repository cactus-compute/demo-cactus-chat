import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Trash, Download, ChevronDown, ChevronUp } from 'lucide-react-native';
import { CactusLM, CactusSTT, type CactusModel, type CactusSTTModel } from 'cactus-react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { useSettingsStore } from '../store/settingsStore';
import { useModelStore } from '../store/modelStore';
import {
  formatModelSize,
  getModelDisplayName,
  isModelDownloaded,
  deleteModel,
} from '../utils/cactusHelpers';
import { useCactusLM } from '../contexts/CactusLMContext';
import { useCactusSTT } from '../contexts/CactusSTTContext';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

export default function SettingsScreen() {
  const cactusLM = useCactusLM();
  const cactusSTT = useCactusSTT();
  const [models, setModels] = useState<CactusModel[]>([]);
  const [sttModels, setSTTModels] = useState<CactusSTTModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [sttLoading, setSTTLoading] = useState(true);
  const [downloadedModels, setDownloadedModels] = useState<Set<string>>(new Set());
  const [downloadedSTTModels, setDownloadedSTTModels] = useState<Set<string>>(new Set());
  const [languageModelsExpanded, setLanguageModelsExpanded] = useState(true);
  const [sttModelsExpanded, setSTTModelsExpanded] = useState(true);

  const {
    maxTokens,
    temperature,
    topP,
    topK,
    systemPrompt,
    selectedModelSlug,
    selectedSTTModelSlug,
    setMaxTokens,
    setTemperature,
    setTopP,
    setTopK,
    setSystemPrompt,
    setSelectedModelSlug,
    setSelectedSTTModelSlug,
  } = useSettingsStore();

  const {
    downloadingModels,
    downloadProgress,
    startDownload,
    updateDownloadProgress,
    completeDownload,
    refreshModels,
  } = useModelStore();

  useEffect(() => {
    loadModels();
    loadSTTModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const allModels = await cactusLM.getModels();
      const filteredModels = allModels.filter(
        (model) => !model.name.toLowerCase().includes('embed')
      );
      setModels(filteredModels);
      refreshModels(filteredModels);

      // Check which models are actually downloaded
      const downloaded = new Set<string>();
      await Promise.all(
        filteredModels.map(async (model) => {
          const isDownloaded = await isModelDownloaded(model);
          if (isDownloaded) {
            downloaded.add(model.slug);
          }
        })
      );
      setDownloadedModels(downloaded);
    } catch (error) {
      Alert.alert('Error', `Failed to load models: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (model: CactusModel) => {
    startDownload(model.slug);

    try {
      // Create a temporary instance for this specific model download
      const tempCactusLM = new CactusLM({ model: model.slug });

      await tempCactusLM.download({
        onProgress: (progress) => {
          updateDownloadProgress(model.slug, progress);
        },
      });

      completeDownload(model.slug);

      // Update downloaded models state
      setDownloadedModels((prev) => new Set([...prev, model.slug]));

      // Automatically select the downloaded model
      setSelectedModelSlug(model.slug);

      Alert.alert(
        'Success',
        `${getModelDisplayName(model)} downloaded and selected`
      );
    } catch (error) {
      completeDownload(model.slug);
      Alert.alert('Error', `Failed to download ${getModelDisplayName(model)}: ${error}`);
    }
  };

  const handleDelete = async (model: CactusModel) => {
    Alert.alert(
      'Delete Model',
      `Are you sure you want to delete ${getModelDisplayName(model)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteModel(model);

              // Update downloaded models state
              setDownloadedModels((prev) => {
                const newSet = new Set(prev);
                newSet.delete(model.slug);
                return newSet;
              });

              // If the deleted model was selected, clear selection
              if (selectedModelSlug === model.slug) {
                setSelectedModelSlug('');
              }

              Alert.alert('Success', `${getModelDisplayName(model)} deleted successfully`);
            } catch (error) {
              Alert.alert('Error', `Failed to delete ${getModelDisplayName(model)}: ${error}`);
            }
          },
        },
      ]
    );
  };

  const handleSelectModel = (model: CactusModel) => {
    if (downloadedModels.has(model.slug)) {
      setSelectedModelSlug(model.slug);
      Alert.alert('Model Selected', `Now using ${getModelDisplayName(model)}`);
    }
  };

  const loadSTTModels = async () => {
    try {
      setSTTLoading(true);
      const allSTTModels = await cactusSTT.getModels();
      setSTTModels(allSTTModels);

      // Check which STT models are actually downloaded
      const downloaded = new Set<string>();
      allSTTModels.forEach((model) => {
        if (model.isDownloaded) {
          downloaded.add(model.slug);
        }
      });
      setDownloadedSTTModels(downloaded);
    } catch (error) {
      Alert.alert('Error', `Failed to load STT models: ${error}`);
    } finally {
      setSTTLoading(false);
    }
  };

  const handleDownloadSTT = async (model: CactusSTTModel) => {
    startDownload(model.slug);

    try {
      const tempSTT = new CactusSTT({ model: model.slug });

      await tempSTT.download({
        onProgress: (progress) => {
          updateDownloadProgress(model.slug, progress);
        },
      });

      completeDownload(model.slug);
      setDownloadedSTTModels((prev) => new Set([...prev, model.slug]));
      setSelectedSTTModelSlug(model.slug);

      Alert.alert(
        'Success',
        `${model.slug} downloaded and selected`
      );
    } catch (error) {
      completeDownload(model.slug);
      Alert.alert('Error', `Failed to download ${model.slug}: ${error}`);
    }
  };

  const handleDeleteSTT = async (model: CactusSTTModel) => {
    Alert.alert(
      'Delete STT Model',
      `Are you sure you want to delete ${model.slug}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteModel(model);

              setDownloadedSTTModels((prev) => {
                const newSet = new Set(prev);
                newSet.delete(model.slug);
                return newSet;
              });

              if (selectedSTTModelSlug === model.slug) {
                setSelectedSTTModelSlug(null);
              }

              Alert.alert('Success', `${model.slug} deleted successfully`);
            } catch (error) {
              Alert.alert('Error', `Failed to delete ${model.slug}: ${error}`);
            }
          },
        },
      ]
    );
  };

  const handleSelectSTTModel = (model: CactusSTTModel) => {
    if (downloadedSTTModels.has(model.slug)) {
      setSelectedSTTModelSlug(model.slug);
      Alert.alert('STT Model Selected', `Now using ${model.slug}`);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={80}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabelWithMargin}>System Prompt</Text>
        <Text style={styles.settingDescription}>
          Instructions that define the AI&apos;s behavior and personality
        </Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={systemPrompt}
          onChangeText={setSystemPrompt}
          multiline
          numberOfLines={4}
          placeholder="Enter system prompt..."
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingItemRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Max Tokens</Text>
            <Text style={styles.settingDescription}>
              Maximum response length
            </Text>
          </View>
          <Text style={styles.sliderValue}>{maxTokens}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={32000}
          step={100}
          value={maxTokens}
          onValueChange={setMaxTokens}
          minimumTrackTintColor={colors.textPrimary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.textPrimary}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingItemRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Temperature</Text>
            <Text style={styles.settingDescription}>
              Creativity level
            </Text>
          </View>
          <Text style={styles.sliderValue}>{temperature.toFixed(2)}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={2}
          step={0.01}
          value={temperature}
          onValueChange={setTemperature}
          minimumTrackTintColor={colors.textPrimary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.textPrimary}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingItemRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Top P</Text>
            <Text style={styles.settingDescription}>
              Nucleus sampling threshold
            </Text>
          </View>
          <Text style={styles.sliderValue}>{topP.toFixed(2)}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          value={topP}
          onValueChange={setTopP}
          minimumTrackTintColor={colors.textPrimary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.textPrimary}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingItemRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Top K</Text>
            <Text style={styles.settingDescription}>
              Limits token selection pool
            </Text>
          </View>
          <Text style={styles.sliderValue}>{topK}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={topK}
          onValueChange={setTopK}
          minimumTrackTintColor={colors.textPrimary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.textPrimary}
        />
      </View>

      <View style={styles.modelsSpacer} />

      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setLanguageModelsExpanded(!languageModelsExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.modelsLabel}>Language Models</Text>
        {languageModelsExpanded ? (
          <ChevronUp size={20} color={colors.textPrimary} />
        ) : (
          <ChevronDown size={20} color={colors.textPrimary} />
        )}
      </TouchableOpacity>

      {languageModelsExpanded && (
        <>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.textPrimary} />
              <Text style={styles.loadingText}>Loading models...</Text>
            </View>
          ) : models.length === 0 ? (
            <Text style={styles.emptyText}>No models available</Text>
          ) : (
            models.map((model) => {
          const downloaded = downloadedModels.has(model.slug);
          const isDownloading = downloadingModels.has(model.slug);
          const progress = downloadProgress[model.slug] || 0;
          const isSelected = selectedModelSlug === model.slug;

          return (
            <View key={model.slug} style={[styles.modelItem, isSelected && styles.modelItemSelected]}>
              <TouchableOpacity
                style={styles.modelContent}
                onPress={() => downloaded && handleSelectModel(model)}
                disabled={!downloaded || isDownloading}
                activeOpacity={0.7}
              >
                <View style={styles.modelInfo}>
                  <View style={styles.modelHeader}>
                    <Text style={[styles.modelName, isSelected && styles.modelNameSelected]}>
                      {getModelDisplayName(model)}
                    </Text>
                  </View>
                  <Text style={[styles.modelDetails, isSelected && styles.modelDetailsSelected]}>
                    {formatModelSize(model.sizeMb)} • Q{model.quantization}
                  </Text>
                  {isDownloading && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                      </View>
                      <Text style={styles.progressText}>
                        {Math.round(progress * 100)}%
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              <View style={styles.modelActions}>
                {!isDownloading && (
                  downloaded ? (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(model)}
                    >
                      <Trash
                        size={20}
                        color={isSelected ? colors.background : colors.error}
                      />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.downloadButton}
                      onPress={() => handleDownload(model)}
                    >
                      <Download size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          );
            })
          )}
        </>
      )}

      <View style={styles.modelsSpacer} />

      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setSTTModelsExpanded(!sttModelsExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.modelsLabel}>Speech-to-Text Models</Text>
        {sttModelsExpanded ? (
          <ChevronUp size={20} color={colors.textPrimary} />
        ) : (
          <ChevronDown size={20} color={colors.textPrimary} />
        )}
      </TouchableOpacity>

      {sttModelsExpanded && (
        <>
          {sttLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.textPrimary} />
              <Text style={styles.loadingText}>Loading STT models...</Text>
            </View>
          ) : sttModels.length === 0 ? (
            <Text style={styles.emptyText}>No STT models available</Text>
          ) : (
            sttModels.map((model) => {
          const downloaded = downloadedSTTModels.has(model.slug);
          const isDownloading = downloadingModels.has(model.slug);
          const progress = downloadProgress[model.slug] || 0;
          const isSelected = selectedSTTModelSlug === model.slug;

          return (
            <View key={model.slug} style={[styles.modelItem, isSelected && styles.modelItemSelected]}>
              <TouchableOpacity
                style={styles.modelContent}
                onPress={() => downloaded && handleSelectSTTModel(model)}
                disabled={!downloaded || isDownloading}
                activeOpacity={0.7}
              >
                <View style={styles.modelInfo}>
                  <View style={styles.modelHeader}>
                    <Text style={[styles.modelName, isSelected && styles.modelNameSelected]}>
                      {model.slug}
                    </Text>
                  </View>
                  <Text style={[styles.modelDetails, isSelected && styles.modelDetailsSelected]}>
                    {formatModelSize(model.sizeMb)}
                  </Text>
                  {isDownloading && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                      </View>
                      <Text style={styles.progressText}>
                        {Math.round(progress * 100)}%
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              <View style={styles.modelActions}>
                {!isDownloading && (
                  downloaded ? (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteSTT(model)}
                    >
                      <Trash
                        size={20}
                        color={isSelected ? colors.background : colors.error}
                      />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.downloadButton}
                      onPress={() => handleDownloadSTT(model)}
                    >
                      <Download size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          );
            })
          )}
        </>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: spacing.lg,
  },
  modelsSpacer: {
    height: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  modelsLabel: {
    ...typography.bodySemibold,
    color: colors.textPrimary,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  modelItemSelected: {
    backgroundColor: colors.textPrimary,
  },
  modelContent: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  modelInfo: {
    flex: 1,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  modelName: {
    ...typography.bodySemibold,
    color: colors.textPrimary,
    fontSize: 17,
  },
  modelNameSelected: {
    color: colors.background,
  },
  modelDetails: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 13,
  },
  modelDetailsSelected: {
    color: colors.background,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.textPrimary,
    borderRadius: 3,
  },
  progressText: {
    ...typography.small,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 40,
  },
  modelActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  downloadButton: {
    padding: spacing.sm,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  settingItem: {
    marginBottom: spacing.lg,
  },
  settingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabelContainer: {
    flex: 1,
    marginRight: spacing.lg,
  },
  settingLabel: {
    ...typography.bodySemibold,
    color: colors.textPrimary,
  },
  settingLabelWithMargin: {
    ...typography.bodySemibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    minWidth: 60,
    textAlign: 'right',
  },
});
