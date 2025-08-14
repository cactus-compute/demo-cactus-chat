import { XStack } from "tamagui";
import { useThemeColor } from '@/hooks/useThemeColor';

type Props = {
    children?: React.ReactNode,
  }

export const PreferenceTile = ({children}: Props) => {
    const surface = useThemeColor({}, 'surface');
    const borderColor = useThemeColor({}, 'border');
    
    return (
        <XStack 
            alignItems='center' 
            gap="$4" 
            padding="$4"
            borderRadius="$6"
            backgroundColor={surface}
            borderWidth={1}
            borderColor={borderColor}
        >
            {children}
        </XStack>
    );
}; 