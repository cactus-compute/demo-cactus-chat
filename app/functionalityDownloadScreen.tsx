import OnboardingScreenLayout from '@/components/ui/onboarding/OnboardingScreenLayout';
import { Text, YStack, Progress, Button, View, Anchor } from 'tamagui';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useModelContext } from '@/contexts/modelContext';
import { RegularText } from '@/components/ui/RegularText';
import { setOnboardingComplete } from '@/services/storage';
import { CactusLM } from 'cactus-react-native';

export default function FunctionalityDownloadScreen() {
    const { modelSlug } = useLocalSearchParams();

    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { refreshModels, setSelectedModel, availableModels, cactusContext } = useModelContext();

    useEffect(() => {
        const downloadModel = async () => {
            try {
                if (!modelSlug) {
                    // If no specific model selected, use default
                    const slug = 'qwen3-0.6'; // Default model

                    // Create a new CactusLM instance specifically for downloading this model
                    const downloadLM = new CactusLM({ model: slug, contextSize: 2048 });

                    // Download the model
                    await downloadLM.download({
                        onProgress: (progress) => {
                            setDownloadProgress(Math.round(progress * 100));
                        }
                    });

                    await refreshModels();

                    // Select the downloaded model
                    const models = await cactusContext.lm?.getModels();
                    const downloadedModel = models?.find(m => m.slug === slug);
                    if (downloadedModel) {
                        setSelectedModel(downloadedModel);
                    }

                    await setOnboardingComplete(true);
                    setIsComplete(true);
                } else {
                    // Download specific model slug
                    // Create a new CactusLM instance specifically for downloading this model
                    const downloadLM = new CactusLM({ model: modelSlug as string, contextSize: 2048 });

                    // Download the model
                    await downloadLM.download({
                        onProgress: (progress) => {
                            setDownloadProgress(Math.round(progress * 100));
                        }
                    });

                    await refreshModels();

                    const models = await cactusContext.lm?.getModels();
                    const downloadedModel = models?.find(m => m.slug === modelSlug);
                    if (downloadedModel) {
                        setSelectedModel(downloadedModel);
                    }

                    await setOnboardingComplete(true);
                    setIsComplete(true);
                }
            } catch (err: any) {
                console.error('Download error:', err);
                setError(err.message || 'Download failed');
            }
        };

        downloadModel();
    }, []);

    return (
        <OnboardingScreenLayout>
            <View width="90%">
                <PageHeader
                    title={error ? 'Download Failed' : isComplete ? 'Download complete ✓' : 'Downloading model...'}
                    subtitle={`Cactus stores and runs all your AI models locally. This means your data never leaves your device, ensuring complete privacy.`}
                />
            </View>
            <YStack flex={1} alignItems='center' justifyContent='center' marginBottom="$8" gap="$2">
                <View width="90%" alignItems='center' gap="$2">
                    <Text fontSize="$4" fontWeight="600">Did you know?</Text>
                    <RegularText>You can integrate text, image, video, and voice AI features powered by Cactus into your own app.</RegularText>
                    <RegularText>Everything in this demo is fully open source.</RegularText>
                    <Anchor fontSize="$3" fontWeight="300" href="https://github.com/cactus-compute/cactus" target="_blank">Check out the repo</Anchor>
                </View>
            </YStack>
            {error ? (
                <YStack width="100%" gap="$2">
                    <RegularText color="$red10">{error}</RegularText>
                    <Button onPress={() => router.back()} width="100%">
                        <Text fontSize="$4" fontWeight="400">Go Back</Text>
                    </Button>
                </YStack>
            ) : isComplete ? (
                <Button onPress={() => router.push('/')} width="100%" backgroundColor="#000">
                    <Text fontSize="$4" fontWeight="400" color="#FFF">Get Started</Text>
                </Button>
            ) : (
                <YStack width="100%" gap="$2">
                    <Progress value={downloadProgress} max={100} width="100%">
                        <Progress.Indicator animation="bouncy" backgroundColor="$green10" />
                    </Progress>
                    <RegularText textAlign="center">{downloadProgress}%</RegularText>
                    <Button onPress={() => router.back()}>
                        <Text fontSize="$3" fontWeight="300">Cancel</Text>
                    </Button>
                </YStack>
            )}
        </OnboardingScreenLayout>
    );
}