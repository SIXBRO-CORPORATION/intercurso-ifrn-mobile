import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from '@/components/button';
import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { colors, radius, spacing } from '@/theme';

function StateIcon({ name, tone }: { name: IconName; tone: 'neutral' | 'danger' }) {
    const background = tone === 'danger' ? colors.dangerSoft : colors.primarySoft;
    const foreground = tone === 'danger' ? colors.danger : colors.primaryDark;

    return (
        <View style={[styles.iconBubble, { backgroundColor: background }]}>
            <Icon name={name} size={28} color={foreground} />
        </View>
    );
}

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
    return (
        <View style={styles.container} accessibilityLiveRegion="polite">
            <ActivityIndicator color={colors.primary} />
            <ThemedText variant="body" style={styles.centered}>
                {label}
            </ThemedText>
        </View>
    );
}

type ErrorStateProps = {
    title: string;
    description: string;
    onRetry?: () => void;
    retrying?: boolean;
};

export function ErrorState({ title, description, onRetry, retrying = false }: ErrorStateProps) {
    return (
        <View style={styles.container} accessibilityRole="alert">
            <StateIcon name="warn" tone="danger" />
            <ThemedText variant="heading" style={styles.centered}>
                {title}
            </ThemedText>
            <ThemedText variant="body" style={[styles.centered, styles.description]}>
                {description}
            </ThemedText>
            {onRetry ? (
                <Button title="Tentar de novo" variant="outline" size="compact" onPress={onRetry} loading={retrying} />
            ) : null}
        </View>
    );
}

type EmptyStateProps = {
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <View style={styles.container}>
            <StateIcon name="search" tone="neutral" />
            <ThemedText variant="heading" style={styles.centered}>
                {title}
            </ThemedText>
            {description ? (
                <ThemedText variant="body" style={[styles.centered, styles.description]}>
                    {description}
                </ThemedText>
            ) : null}
            {actionLabel && onAction ? (
                <Button title={actionLabel} variant="soft" size="compact" onPress={onAction} />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        gap: spacing.sm,
    },
    iconBubble: {
        width: 64,
        height: 64,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    centered: {
        textAlign: 'center',
    },
    description: {
        color: colors.textSecondary,
        maxWidth: 280,
    },
});
