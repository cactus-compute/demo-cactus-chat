import React from 'react';

import { Button, XStack, YStack  } from 'tamagui'; // Assuming Text is needed if Button content isn't enough
import { Download, Trash, Check } from '@tamagui/lucide-icons'; // Assuming icon imports
import { RegularText } from '@/components/ui/RegularText';
import { useModelContext } from '@/contexts/modelContext';
import { useThemeColor } from '@/hooks/useThemeColor';

// Define the props for the component
interface ModelListItemProps {
  modelName: string;
  modelComment?: string;
  downloaded: boolean;
  isSelected?: boolean;
  downloadInProgress: boolean;
  onDownloadClick: () => void;
  onDeleteClick: () => void;
}

/**
 * A component representing a single model in a list,
 * showing download or delete actions based on its status.
 */
export const ModelListItem: React.FC<ModelListItemProps> = ({
  modelName,
  modelComment,
  downloaded,
  isSelected,
  downloadInProgress,
  onDownloadClick,
  onDeleteClick,
}) => {

  const { setSelectedModel, availableModels, isContextLoading } = useModelContext()
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');

  // Note: this is a REPULSIVE workaround to the fact that we're not passing in Model into here... DISGUSTING. FIX
  const downloadedModel = availableModels.find(model => model.label === modelName)

  return (
    <XStack 
      key={modelName} 
      alignItems="center"
      borderWidth={1}
      borderColor={isSelected ? tintColor : borderColor}
      borderRadius='$4'
      paddingVertical="$2.5"
      paddingHorizontal="$3"
      onPress={() => {downloadedModel && !isContextLoading ? setSelectedModel(downloadedModel) : onDownloadClick()}}
    >
      <YStack flex={1} marginRight="$2">
        <RegularText textAlign='left' fontWeight={400} color={downloaded ? textColor : textSecondary}>{modelName}</RegularText>
        {modelComment && <RegularText textAlign='left' color={downloaded ? textColor : textSecondary}>{modelComment}</RegularText>}
      </YStack>

      {/* Action Button: Download or Delete */}
      {downloaded ? (
        <XStack alignItems='center' gap="$2">
        <Button
          size="$2"
          circular
          chromeless
          icon={isSelected ? <Check size="$1" color={successColor}/>  : <Trash size="$1" color={errorColor}/>}
          onPress={() => onDeleteClick()}
          aria-label={`Delete model ${modelName}`} // Accessibility
        />
        </XStack>
      ) : (
        <XStack alignItems='center' gap="$2">
          <Button
            size="$2"
            circular
            chromeless
            icon={<Download size="$1" color={tintColor}/>}
            onPress={() => onDownloadClick()}
            disabled={downloadInProgress}
            opacity={downloadInProgress ? 0.5 : 1}
            aria-label={`Download model ${modelName}`} // Accessibility
          />
        </XStack>
      )}
    </XStack>
  );
};