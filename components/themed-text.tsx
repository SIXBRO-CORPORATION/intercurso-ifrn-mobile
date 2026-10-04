import { Text, type TextProps } from 'react-native';
import { typography, type TypographyVariant } from '@/theme';

interface ThemedTextProps extends TextProps {
    variant?: TypographyVariant;
}


export function ThemedText({ variant = 'body', style, ...props }: ThemedTextProps) {
    return <Text {...props} style={[typography[variant], style]} />;
}
