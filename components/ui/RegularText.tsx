import { Text, TextProps } from 'tamagui';
import { useThemeColor } from '@/hooks/useThemeColor';

export const RegularText = (props: TextProps) => {
    const textColor = useThemeColor({}, 'text');
    
    return (
        <Text 
            fontSize="$3" 
            fontWeight="300" 
            textAlign='center' 
            color={textColor}
            {...props} 
        />
    );
}; 