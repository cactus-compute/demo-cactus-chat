import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { X, Image as ImageIcon, Square, ArrowUp, AudioLines } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';
import { useCactusSTT } from '@/contexts/CactusSTTContext';


// Audio Streaming Config
const AUDIO_SAMPLE_RATE = 16000; // 16kHz sample rate (whisper requirement)
const AUDIO_BUFFER_LENGTH_IN_SAMPLES = AUDIO_SAMPLE_RATE * 1; // 1 second buffer, onAudioReady function called every 1 second
const AUDIO_MIN_TRANSCRIBE_SAMPLES = AUDIO_SAMPLE_RATE * 2; // Minimum 2 seconds of audio to transcribe
const AUDIO_MAX_BUFFER_SAMPLES = AUDIO_SAMPLE_RATE * 30; // Keep last 30 seconds of audio (whispers limit)

interface MessageInputProps {
  onSend: (message: string, images?: string[]) => void | Promise<void>;
  disabled?: boolean;
  isGenerating: boolean;
  onStop: () => void;
  supportsVision: boolean;
}

export function MessageInput({ onSend, disabled, isGenerating, onStop, supportsVision }: MessageInputProps) {
  const [audioRecorder] = useState(() => new AudioRecorder({
    sampleRate: AUDIO_SAMPLE_RATE,
    bufferLengthInSamples: AUDIO_BUFFER_LENGTH_IN_SAMPLES,
  }));
  const committedTranscription = useRef('');
  const previousTranscription = useRef('');
  const previousBufferLength = useRef(0);
  const currentTranscription = useRef('');
  const currentBuffer = useRef<number[]>([]);
  const isTranscribingRef = useRef(false);
  const cactusSTT = useCactusSTT();

  const [isRecording, setIsRecording] = useState(false);
  const [streamingTranscription, setStreamingTranscription] = useState('');

  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const hasText = text.trim().length > 0;

  const cleanTranscription = (transcription: string) => {
    return transcription.replace(/<\|startoftranscript\|>/g, '').trim();
  };


  const calculateSimilarity = (str1: string, str2: string): number => {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix: number[][] = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return 1 - distance / maxLen;
  };

  const fuzzyMatch = (previous: string, current: string, threshold: number = 0.9): boolean => {
    if (!previous || !current) return false;

    const prevNorm = previous.toLowerCase().trim();
    const currNorm = current.toLowerCase().trim();

    if (currNorm.startsWith(prevNorm)) return true;

    const prefixLength = prevNorm.length;
    if (currNorm.length < prefixLength) return false;

    const currentPrefix = currNorm.substring(0, prefixLength);
    const similarity = calculateSimilarity(prevNorm, currentPrefix);
    return similarity >= threshold;
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

  useEffect(() => {
    // Audio setup
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'default',
      iosOptions: ['defaultToSpeaker', 'allowBluetoothA2DP'],
    });
    audioRecorder.onAudioReady(async ({ buffer }) => {
      // Append new audio data to buffer
      currentBuffer.current.push(...buffer.getChannelData(0));

      // Keep only the last 30 seconds of audio
      if (currentBuffer.current.length > AUDIO_MAX_BUFFER_SAMPLES) {
        currentBuffer.current = currentBuffer.current.slice(currentBuffer.current.length - AUDIO_MAX_BUFFER_SAMPLES);
      }

      if (currentBuffer.current.length >= AUDIO_MIN_TRANSCRIBE_SAMPLES && !isTranscribingRef.current) {
        isTranscribingRef.current = true;

        // Take current audio buffer for transcription
        const current = [...currentBuffer.current];


        // Convert float32 audio to uint8 PCM
        const pcm16Buffer = new Int16Array(current.length);
        for (let i = 0; i < current.length; i++) {
          const clamped = Math.max(-1, Math.min(1, current[i]));
          pcm16Buffer[i] = Math.round(clamped * 32767);
        }
        const pcm8 = new Uint8Array(pcm16Buffer.buffer);

        // Transcribe audio
        const result = await cactusSTT.transcribe({
          audio: Array.from(pcm8),
        });
        await cactusSTT.reset();

        currentTranscription.current = result.response;

        // Update streaming transcription
        setStreamingTranscription(cleanTranscription(committedTranscription.current + currentTranscription.current));

        // If previous transcription gets confirmed in current (using fuzzy matching), commit it
        if (fuzzyMatch(previousTranscription.current, currentTranscription.current)) {
          // Commit previous transcription
          committedTranscription.current += previousTranscription.current;
          // Remove committed part from audio buffer
          currentBuffer.current = currentBuffer.current.slice(previousBufferLength.current);
        }

        // Update previous transcription
        previousTranscription.current = currentTranscription.current;
        // Update previous audio buffer length
        previousBufferLength.current = current.length;

        isTranscribingRef.current = false;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = () => {
    previousTranscription.current = '';
    committedTranscription.current = '';
    currentBuffer.current = [];
    previousBufferLength.current = 0;
    setStreamingTranscription('');
    setIsRecording(true);
    audioRecorder.start();
  };

  const stopRecording = async () => {
    audioRecorder.stop();
    setIsRecording(false);
    setStreamingTranscription('');
    setText(cleanTranscription(committedTranscription.current + currentTranscription.current));
  };

  const cancelRecording = () => {
    audioRecorder.stop();
    setIsRecording(false);
    setStreamingTranscription('');
  };

  return (
    <View style={styles.container}>
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
          onPress={isRecording ? cancelRecording : pickImage}
        >
          {isRecording ? (
            <X size={18} color={colors.textPrimary} strokeWidth={3} />
          ) : (
            <ImageIcon
              size={24}
              color={colors.textPrimary}
            />
          )}
        </TouchableOpacity>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={isRecording ? streamingTranscription : text}
            onChangeText={setText}
            placeholder="Ask anything"
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={2000}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            editable={!isRecording}
          />
          <TouchableOpacity
            style={styles.sendStopButton}
            onPress={isRecording ? stopRecording : isGenerating ? onStop : hasText ? handleSend : startRecording}
            disabled={!isRecording && !isGenerating && !hasText && disabled}
          >
            {isRecording || isGenerating ? (
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
});
