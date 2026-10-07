import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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

export function LinkRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${value}`}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
        >
            <ThemedText variant="subhead">{label}</ThemedText>
            <View style={styles.linkValue}>
                <ThemedText variant="body" style={styles.value} numberOfLines={1}>
                    {value}
                </ThemedText>
                <ThemedText variant="body" style={styles.chevron}>
                    ›
                </ThemedText>
            </View>
        </Pressable>
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
    linkValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        flexShrink: 1,
    },
    chevron: {
        color: colors.secondaryLabel as string,
    },
});
