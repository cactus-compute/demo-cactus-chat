import { ArrowRight } from '@tamagui/lucide-icons';
import { useModelContext } from '@/contexts/modelContext';
import { XStack } from 'tamagui';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { RegularText } from '../RegularText';
import { ActivityIndicator } from 'react-native';

export function ModelDisplay() {
  const { availableModels, selectedModel, isContextLoading } = useModelContext();
  const { t } = useTranslation();

  function ModelDisplayPlaceholder() {
    // Placeholder we display when no models are available
    return (
      <XStack gap="$2" alignItems="center" justifyContent="center" flex={1} hitSlop={5} onPress={() => router.push('/settingsScreen')}>
        <RegularText>{t('emptyModelDisplay')}</RegularText>
        <ArrowRight size="$1" color="$gray10"/>
      </XStack>
    )
  }

  if(isContextLoading){
    return <ActivityIndicator/>
  }

  if (!availableModels.filter(model => !model.disabled).length) {
    return <ModelDisplayPlaceholder />
  }

  return (
    <RegularText fontWeight={600}>{selectedModel?.value}</RegularText>
  );
} 