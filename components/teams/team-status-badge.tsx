import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { TeamStatusLabel, type TeamStatus } from '@/types/enums';
import { colors, onTint, radius, spacing, useBrandColors } from '@/theme';

export function TeamStatusBadge({ status }: { status: TeamStatus }) {
    const brand = useBrandColors();
    const highlighted = status === 'APPROVED';

    return (
        <View
            style={[styles.pill, { backgroundColor: highlighted ? brand.primary : (colors.separator as string) }]}
            accessible
            accessibilityLabel={`Status: ${TeamStatusLabel[status]}`}
        >
            <ThemedText variant="code" style={highlighted ? { color: onTint } : undefined}>
                {TeamStatusLabel[status].toUpperCase()}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    pill: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
    },
});
