import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { TeamStatusLabel, type TeamStatus } from '@/types/enums';
import { colors, fontFamily, radius, spacing } from '@/theme';

interface StatusStyle {
    background: string;
    foreground: string;
}

const statusStyles: Record<TeamStatus, StatusStyle> = {
    DRAFT: { background: colors.field, foreground: colors.textSecondary },
    SUBMITTED: { background: colors.warningSoft, foreground: colors.warningText },
    APPROVED: { background: colors.primarySoft, foreground: colors.primaryDark },
    REJECTED: { background: colors.dangerSoft, foreground: colors.danger },
};

export function TeamStatusBadge({ status }: { status: TeamStatus }) {
    const { background, foreground } = statusStyles[status];

    return (
        <View
            style={[styles.pill, { backgroundColor: background }]}
            accessible
            accessibilityLabel={`Status: ${TeamStatusLabel[status]}`}
        >
            <ThemedText variant="caption" style={[styles.label, { color: foreground }]}>
                {TeamStatusLabel[status]}
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
