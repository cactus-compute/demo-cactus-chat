import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Image as ImageIcon, Square, ArrowUp, AudioLines } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAudioRecorder, useAudioRecorderState, setAudioModeAsync, requestRecordingPermissionsAsync, IOSOutputFormat, AudioQuality } from 'expo-audio';
import { Paths, File } from 'expo-file-system';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { useCactusSTT } from '../contexts/CactusSTTContext';
import { useSettingsStore } from '../store/settingsStore';
import { convertPCMToWAV } from '../utils/audioHelpers';

interface MessageInputProps {
  onSend: (message: string, images?: string[]) => void | Promise<void>;
  disabled?: boolean;
  isGenerating: boolean;
  onStop: () => void;
  supportsVision: boolean;
}

const MAX_DURATION = 30;

export function MessageInput({ onSend, disabled, isGenerating, onStop, supportsVision }: MessageInputProps) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [waveformData, setWaveformData] = useState<number[]>(Array(MAX_DURATION).fill(-160));

  const insets = useSafeAreaInsets();
  const cactusSTT = useCactusSTT();
  const { selectedSTTModelSlug } = useSettingsStore();

  const recorder = useAudioRecorder({
    extension: '.wav',
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    android: {
      extension: '.wav',
      outputFormat: 'default',
      audioEncoder: 'default',
      sampleRate: 16000,
    },
    ios: {
      extension: '.wav',
      outputFormat: IOSOutputFormat.LINEARPCM,
      audioQuality: AudioQuality.MAX,
      sampleRate: 16000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {
      mimeType: 'audio/wav',
      bitsPerSecond: 256000,
    }
  });
  const recorderState = useAudioRecorderState(recorder);

  const hasText = text.trim().length > 0;

  const cleanTranscription = (transcription: string) => {
    return transcription.replace(/<\|startoftranscript\|>/g, '').trim();
  };

  // Update waveform data with current metering
  useEffect(() => {
    if (recorderState.isRecording && recorderState.metering !== undefined) {
      const currentBar = Math.floor((recorderState.durationMillis / 1000));
      if (currentBar < MAX_DURATION) {
        setWaveformData(prev => {
          const updated = [...prev];
          updated[currentBar] = recorderState.metering || -160;
          return updated;
        });
      }
    }
  }, [recorderState.metering, recorderState.durationMillis, recorderState.isRecording]);

  const handleRecordingComplete = async () => {
    const uri = recorder.uri;
    if (!uri) return;

    try {
      // Convert raw PCM to proper WAV format with RIFF headers
      const audio = await convertPCMToWAV(uri, 16000, 1, 16);

      try {
        const result = await cactusSTT.transcribe({ audio });
        if (result.response) {
          const cleanedResponse = cleanTranscription(result.response);
          setText((prev) => (prev ? prev + ' ' : '') + cleanedResponse);
        }
      } catch (transcribeError) {
        Alert.alert('Transcription Error', `Failed to transcribe audio: ${transcribeError}`);
      } finally {
        await cactusSTT.reset();
      }
    } catch (error) {
      Alert.alert('Error', `Failed to process recording: ${error}`);
    }
  };

  const handleSend = () => {
    if (!hasText || disabled) return;

    onSend(text.trim(), images.length > 0 ? images : undefined);
    setText('');
    setImages([]);
  };

  const pickImage = async () => {
    if (!supportsVision) {
      Alert.alert(
        'Vision Model Required',
        'The current model does not support vision. Please select a vision-capable model like lfm2-vl-450m.',
        [{ text: 'OK' }]
      );
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      const uris = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...uris]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    if (!selectedSTTModelSlug) {
      Alert.alert(
        'STT Model Required',
        'Please select a Speech-to-Text model in Settings to use voice input.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Required', 'Microphone permission is required for recording.');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      setWaveformData(Array(MAX_DURATION).fill(-160));
      await recorder.prepareToRecordAsync();
      recorder.record({ forDuration: MAX_DURATION });
    } catch (error) {
      Alert.alert('Error', `Failed to start recording: ${error}`);
    }
  };

  const stopRecording = async () => {
    if (!recorderState.isRecording) return;
    try {
      await recorder.stop();
      await handleRecordingComplete();
    } catch (error) {
      Alert.alert('Error', `Failed to stop recording: ${error}`);
    }
  };

  const cancelRecording = async () => {
    if (!recorderState.isRecording) return;
    try {
      await recorder.stop();
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      {images.length > 0 && (
        <ScrollView
          horizontal
          style={styles.imagesContainer}
          contentContainerStyle={styles.imagesContent}
          showsHorizontalScrollIndicator={false}
        >
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <X size={14} color={colors.textPrimary} strokeWidth={3} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={recorderState.isRecording ? cancelRecording : pickImage}
        >
          {recorderState.isRecording ? (
            <X size={18} color={colors.textPrimary} strokeWidth={3} />
          ) : (
            <ImageIcon
              size={24}
              color={colors.textPrimary}
            />
          )}
        </TouchableOpacity>
        <View style={styles.inputContainer}>
          {recorderState.isRecording ? (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <View style={styles.waveformContainer}>
                {waveformData.map((metering, index) => {
                  const normalizedHeight = Math.max(0.1, Math.min(1, (metering + 160) / 160));
                  const currentBarIndex = Math.floor((recorderState.durationMillis / 1000));
                  const isPast = index < currentBarIndex;

                  return (
                    <View
                      key={index}
                      style={[
                        styles.waveformBar,
                        {
                          height: `${normalizedHeight * 100}%`,
                          backgroundColor: isPast ? colors.textPrimary : colors.textTertiary,
                        }
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          ) : (
            <TextInput
              style={styles.input}
              value={cactusSTT.isGenerating ? cleanTranscription(cactusSTT.transcription) : text}
              onChangeText={setText}
              placeholder="Ask anything"
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={2000}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              editable={!cactusSTT.isGenerating}
            />
          )}
          <TouchableOpacity
            style={styles.sendStopButton}
            onPress={recorderState.isRecording ? stopRecording : isGenerating ? onStop : hasText ? handleSend : startRecording}
            disabled={!recorderState.isRecording && !isGenerating && !hasText && disabled}
          >
            {cactusSTT.isGenerating ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : recorderState.isRecording || isGenerating ? (
              <Square size={14} color={colors.background} fill={colors.background} />
            ) : hasText ? (
              <ArrowUp size={20} color={colors.background} />
            ) : (
              <AudioLines size={20} color={colors.background} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  imagesContainer: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  imagesContent: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  imageWrapper: {
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  removeImageButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  imageButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    ...typography.body,
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    paddingRight: 48,
    color: colors.textPrimary,
  },
  sendStopButton: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.lg,
    paddingRight: 48,
    height: 40,
    flex: 1,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff4444',
    marginRight: spacing.sm,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 24,
    gap: 2,
  },
  waveformBar: {
    flex: 1,
    minWidth: 2,
    borderRadius: 1,
  },
});
