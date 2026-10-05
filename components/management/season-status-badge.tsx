import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { SeasonStatusLabel, type SeasonStatus } from '@/types/enums';
import { colors, onTint, radius, spacing, useBrandColors } from '@/theme';

const HIGHLIGHTED: SeasonStatus[] = ['REGISTRATION_OPEN', 'IN_PROGRESS'];

export function SeasonStatusBadge({ status }: { status: SeasonStatus }) {
    const brand = useBrandColors();
    const highlighted = HIGHLIGHTED.includes(status);

    return (
        <View
            style={[styles.pill, { backgroundColor: highlighted ? brand.primary : (colors.separator as string) }]}
            accessible
            accessibilityLabel={`Status: ${SeasonStatusLabel[status]}`}
        >
            <ThemedText variant="code" style={highlighted ? { color: onTint } : undefined}>
                {SeasonStatusLabel[status].toUpperCase()}
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
