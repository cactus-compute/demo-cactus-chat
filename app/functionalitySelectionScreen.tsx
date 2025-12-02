import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Text, YStack, Button, View } from 'tamagui';
import { MessagesSquare } from '@tamagui/lucide-icons'
import type { IconProps } from "@tamagui/helpers-icon";
import { CactusFunctionalityOption } from '@/components/ui/onboarding/CactusFunctionalityOption';
import OnboardingScreenLayout from '@/components/ui/onboarding/OnboardingScreenLayout';
import { ActivityIndicator } from 'react-native';
import { RegularText } from '@/components/ui/RegularText';
import { PageHeader } from '@/components/ui/PageHeader';
import { useModelContext } from '@/contexts/modelContext';
import { CactusModel } from '@/services/models';

export interface CactusFunctionalitySelection {
    id: string;
    model: CactusModel;
    title: string;
    description: string;
    required: boolean;
    selected: boolean;
    icon: (props: IconProps) => JSX.Element;
}

export default function FunctionalitySelectionScreen() {
    const [functionalitySelections, setFunctionalitySelections] = useState<CactusFunctionalitySelection[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { cactusContext } = useModelContext();

    const onContinue = () => {
        const selectedModel = functionalitySelections.find(s => s.selected);
        if (selectedModel) {
            router.push({
                pathname: '/functionalityDownloadScreen',
                params: {
                    modelSlug: selectedModel.model.slug
                }
            });
        }
    };

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const models = await cactusContext.lm?.getModels();
                if (models && models.length > 0) {
                    // Find a good default model (smallest or recommended)
                    const defaultModel = models.reduce((smallest, current) =>
                        current.sizeMb < smallest.sizeMb ? current : smallest
                    );

                    const selections: CactusFunctionalitySelection[] = [{
                        id: "chat",
                        model: defaultModel,
                        title: "Cactus Chat",
                        description: `${defaultModel.name} - ${(defaultModel.sizeMb / 1024).toFixed(2)} GB`,
                        required: true,
                        selected: true,
                        icon: MessagesSquare,
                    }];

                    setFunctionalitySelections(selections);
                }
            } catch (error) {
                console.error('Error fetching models:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchModels();
    }, []);

    return (
        <OnboardingScreenLayout>
            <PageHeader
                title="Get started with Cactus"
                subtitle="Download a model to start chatting offline."
            />
            <YStack flex={1} alignItems='center' paddingTop="$4" gap="$2">
                {isLoading ? (
                    <ActivityIndicator />
                ) : (
                    <>
                        {functionalitySelections.map((selection) => (
                            <CactusFunctionalityOption
                                key={selection.id}
                                icon={selection.icon}
                                title={selection.title}
                                description={selection.description}
                                selected={selection.selected}
                                onPress={() => {}}
                                required={selection.required}
                            />
                        ))}
                        <View marginTop="$4">
                            <RegularText>The Cactus framework also supports image, video, and audio! {'\n\n'} This functionality will be added to the app soon.</RegularText>
                        </View>
                    </>
                )}
            </YStack>
            <Button width="100%" backgroundColor="#000" onPress={onContinue} disabled={isLoading || functionalitySelections.length === 0}>
                {isLoading ? (
                    <ActivityIndicator />
                ) : (
                    <Text color="#FFF" fontSize="$4" fontWeight="400">Download and Continue</Text>
                )}
            </Button>
        </OnboardingScreenLayout>
    );
}