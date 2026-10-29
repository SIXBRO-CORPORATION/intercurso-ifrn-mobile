import { Text, type TextProps } from 'react-native';
import { textStyles, type TextStyleVariant } from '@/theme';

const legacyVariantAlias = {
    headline: 'section',
    subhead: 'body',
    score: 'timer',
    code: 'overline',
} as const satisfies Record<string, TextStyleVariant>;

type LegacyVariant = keyof typeof legacyVariantAlias;

type ThemedTextProps = TextProps & {
    variant?: TextStyleVariant | LegacyVariant;
};

export function ThemedText({ variant = 'body', style, ...props }: ThemedTextProps) {
    const resolvedVariant: TextStyleVariant =
        variant in legacyVariantAlias ? legacyVariantAlias[variant as LegacyVariant] : (variant as TextStyleVariant);

    return <Text {...props} style={[textStyles[resolvedVariant], style]} />;
}
