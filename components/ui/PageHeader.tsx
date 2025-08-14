import { Button, Text, YStack } from 'tamagui';
import { ArrowLeft } from '@tamagui/lucide-icons';
import { router } from 'expo-router';

import { RegularText } from '@/components/ui/RegularText';
import { useThemeColor } from '@/hooks/useThemeColor';

type Props = {
    title: string,
    subtitle?: string,
    includeBackButton?: boolean;
}

export const PageHeader = (props: Props) => {
    const textColor = useThemeColor({}, 'text');
    const iconColor = useThemeColor({}, 'icon');
    
    return (
        <YStack alignItems='center' gap="$2" width='100%'>
            {props.includeBackButton && 
                <Button 
                    icon={<ArrowLeft size="$1" color={iconColor}/>}
                    onPress={() => router.back()}
                    size="$2"
                    chromeless
                    position='absolute'
                    start="$2.5"
                />
            }
            <Text fontSize="$5" fontWeight="600" color={textColor}>{props.title}</Text>
            {props.subtitle && <RegularText>{props.subtitle}</RegularText>}
        </YStack>
    )
}