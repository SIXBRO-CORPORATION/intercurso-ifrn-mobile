import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { colors, radius, shadows, spacing } from '@/theme';

export function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View style={styles.section}>
            <ThemedText variant="caption" style={styles.title}>
                {title.toUpperCase()}
            </ThemedText>
            <View style={styles.card}>{children}</View>
        </View>
    );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
            <ThemedText variant="subhead">{label}</ThemedText>
            <ThemedText variant="body" style={styles.value} selectable>
                {value}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        gap: spacing.xs,
    },
    title: {
        marginLeft: spacing.sm,
    },
    card: {
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.secondarySystemBackground as string,
        boxShadow: shadows.card,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
        minHeight: 32,
    },
    value: {
        flexShrink: 1,
        textAlign: 'right',
    },
});
