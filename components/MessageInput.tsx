import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
    if ((text.trim() || images.length > 0) && !disabled) {
      onSend(text.trim(), images.length > 0 ? images : undefined);
      setText('');
      setImages([]);
    }
  };

  const pickImage = async () => {
    if (!supportsVision) {
      Alert.alert(
        'Vision Model Required',
        'The current model does not support vision. Please select a vision-capable model (like lfm2-vl-450m) in Settings to use image inputs.',
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

  const canSend = (text.trim() || images.length > 0) && !disabled;

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
                <Ionicons name="close-circle" size={20} color={colors.background} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={pickImage}
          disabled={disabled || isGenerating}
        >
          <Ionicons
            name="image-outline"
            size={24}
            color={disabled || isGenerating ? colors.textDisabled : colors.textPrimary}
          />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Ask anything"
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={2000}
          editable={!disabled}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        {isGenerating ? (
          <TouchableOpacity style={styles.stopButton} onPress={onStop}>
            <Ionicons name="stop" size={20} color={colors.background} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!canSend}
          >
            <Ionicons
              name="send"
              size={20}
              color={canSend ? colors.textPrimary : colors.textDisabled}
            />
          </TouchableOpacity>
        )}
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
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.full,
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
  },
  input: {
    ...typography.body,
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    marginRight: spacing.sm,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  stopButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
