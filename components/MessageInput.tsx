import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Image as ImageIcon, Square, ArrowUp } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

interface MessageInputProps {
  onSend: (message: string, images?: string[]) => void | Promise<void>;
  disabled?: boolean;
  isGenerating: boolean;
  onStop: () => void;
  supportsVision: boolean;
}

export function MessageInput({ onSend, disabled, isGenerating, onStop, supportsVision }: MessageInputProps) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim(), images.length > 0 ? images : undefined);
      setText('');
      setImages([]);
    }
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

  const canSend = text.trim() && !disabled;

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
                <X size={14} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={pickImage}
        >
          <ImageIcon
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Ask anything"
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={2000}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          {isGenerating ? (
            <TouchableOpacity style={styles.sendStopButton} onPress={onStop}>
              <Square size={14} color={colors.background} fill={colors.background} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendStopButton, !canSend && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!canSend}
            >
              <ArrowUp
                size={20}
                color={colors.background}
              />
            </TouchableOpacity>
          )}
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
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
