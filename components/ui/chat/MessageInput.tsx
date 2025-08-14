import { Spinner, YStack, Button, Input, XStack } from "tamagui"
import { Send, Pause, Mic } from "@tamagui/lucide-icons";
import { Model } from "@/services/models";
import { useState, memo} from "react";
import { requestMicrophonePermission } from "@/utils/voiceFunctions";
import { useModelContext } from "@/contexts/modelContext";
import { useThemeColor } from '@/hooks/useThemeColor';

// --- Define Props for the Extracted Button Component ---
interface MessageInputButtonProps {
    inputText: string;
    isStreaming: boolean;
    modelIsLoading: boolean;
    isSendDisabled: boolean;
    isVoiceDisabled: boolean;
    onSendPress: () => void; 
    onPausePress: () => void; 
    setVoiceMode: (voiceMode: boolean) => void;
}

const MessageInputButton = memo(function MessageInputButton({
    inputText,
    isStreaming,
    modelIsLoading,
    isSendDisabled,
    isVoiceDisabled,
    onSendPress,
    onPausePress,
    setVoiceMode
}: MessageInputButtonProps) {
    // Conditional rendering based on props
    if (isStreaming) {
        return <Button icon={<Pause size="$1.5"/>} onPress={onPausePress} aria-label="Pause Streaming" chromeless/>;
    }

    if (isStreaming ||modelIsLoading) {
        // Wrap Spinner in YStack for consistent layout within the parent's YStack
        return <Spinner size="small" />
    }

    if (inputText.trim() === '') {
        return (
            <Button 
                icon={<Mic size="$1.5"/>} 
                onPress={async () => {
                    await requestMicrophonePermission((_) => {});
                    setVoiceMode(true);
                }}
                disabled={isVoiceDisabled}
                opacity={isVoiceDisabled ? 0.25 : 1} // Use the passed disabled prop
                chromeless
            />
        );
    }

    // Default Send button
    return (
        <XStack alignItems="center" justifyContent="center" gap="$0">
            <Button
                icon={<Send size="$1.5"/>}
                onPress={onSendPress}
                disabled={isSendDisabled}
                opacity={isSendDisabled ? 0.25 : 1} // Use the passed disabled prop
                aria-label="Send Message"
                chromeless
            />
        </XStack>
    );
});

interface MessageInputProps {
    sendMessage: (input: string) => void;
    isStreaming: boolean;
    selectedModel: Model | null;
    setVoiceMode: (voiceMode: boolean) => void;
}

function MessageInputComponent({ sendMessage, isStreaming, selectedModel, setVoiceMode }: MessageInputProps) {
    const [ inputText, setInputText ] = useState<string>('')
    const { isContextLoading, cactusContext } = useModelContext()
    const backgroundColor = useThemeColor({}, 'surface');
    const borderColor = useThemeColor({}, 'border');
    const textColor = useThemeColor({}, 'text');

    const onSubmit = () => {
        sendMessage(inputText)
        setInputText('')
    }

    const handlePause = () => {
        console.log('pause!')
        cactusContext.context?.stopCompletion();
    }

    return (
        <XStack 
            paddingVertical={16}
            borderWidth={1}
            borderColor={isContextLoading ? '$gray8' : borderColor}
            borderRadius='$6'
            marginBottom='$2'
            padding="$2"
            backgroundColor={backgroundColor}
        >
            <Input 
            // <TextArea
                flex={1} 
                marginRight={8}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Message..."
                onSubmitEditing={onSubmit}
                borderWidth={0}
                backgroundColor="transparent"
                color={textColor}
                placeholderTextColor={useThemeColor({}, 'textSecondary')}
            />
            <YStack alignItems="center" justifyContent="center" minWidth="$6">
                <MessageInputButton 
                    inputText={inputText}
                    isStreaming={isStreaming}
                    modelIsLoading={isContextLoading}
                    isSendDisabled={!selectedModel || inputText.trim() === ''}
                    isVoiceDisabled={!selectedModel || inputText.trim() !== ''}
                    onSendPress={onSubmit}
                    onPausePress={handlePause}
                    setVoiceMode={setVoiceMode}
                />
            </YStack>
        </XStack>
    )
}

export const MessageInput = MessageInputComponent