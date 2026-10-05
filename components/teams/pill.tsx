import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { colors, onTint, radius, spacing, useBrandColors } from '@/theme';

export type PillTone = 'filled' | 'neutral' | 'outline';

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: PillTone }) {
    const brand = useBrandColors();

    const backgroundColor =
        tone === 'filled' ? brand.primary : tone === 'neutral' ? (colors.separator as string) : 'transparent';
    const color = tone === 'filled' ? onTint : tone === 'outline' ? brand.primary : undefined;

    return (
        <View
            style={[
                styles.pill,
                { backgroundColor },
                tone === 'outline' && { borderWidth: 1, borderColor: brand.primary },
            ]}
        >
            <ThemedText variant="code" style={color ? { color } : undefined}>
                {label}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    pill: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.full,
    },
});
