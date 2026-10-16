import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { colors, fontFamily, radius, spacing } from '@/theme';

export type PillTone = 'filled' | 'neutral' | 'outline' | 'dark' | 'soft';

interface ToneStyle {
    background: string;
    foreground: string;
    borderColor?: string;
    borderWidth?: number;
}

const tones: Record<PillTone, ToneStyle> = {
    filled: { background: colors.primary, foreground: colors.surface },
    neutral: { background: colors.field, foreground: colors.textSecondary },
    outline: { background: 'transparent', foreground: colors.primary, borderColor: colors.primary, borderWidth: 1 },
    dark: { background: colors.ink, foreground: colors.surface },
    soft: { background: colors.primarySoft, foreground: colors.primaryDark },
};

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: PillTone }) {
    const { background, foreground, borderColor, borderWidth } = tones[tone];

    return (
        <View style={[styles.pill, { backgroundColor: background, borderColor, borderWidth }]}>
            <ThemedText variant="caption" style={[styles.label, { color: foreground }]}>
                {label}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    pill: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        borderCurve: 'continuous',
    },
    label: {
        fontFamily: fontFamily.bold,
    },
});
