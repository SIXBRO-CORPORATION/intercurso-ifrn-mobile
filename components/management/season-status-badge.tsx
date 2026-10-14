import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { SeasonStatusLabel, type SeasonStatus } from '@/types/enums';
import { colors, fontFamily, radius, spacing } from '@/theme';

interface StatusStyle {
    background: string;
    foreground: string;
}

const statusStyles: Record<SeasonStatus, StatusStyle> = {
    DRAFT: { background: colors.field, foreground: colors.textSecondary },
    REGISTRATION_OPEN: { background: colors.primarySoft, foreground: colors.primaryDark },
    REGISTRATION_CLOSED: { background: colors.warningSoft, foreground: colors.warningText },
    IN_PROGRESS: { background: colors.primary, foreground: colors.surface },
    FINISHED: { background: colors.field, foreground: colors.ink },
};

export function SeasonStatusBadge({ status }: { status: SeasonStatus }) {
    const { background, foreground } = statusStyles[status];

    return (
        <View
            style={[styles.pill, { backgroundColor: background }]}
            accessible
            accessibilityLabel={`Status: ${SeasonStatusLabel[status]}`}
        >
            <ThemedText variant="caption" style={[styles.label, { color: foreground }]}>
                {SeasonStatusLabel[status]}
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
