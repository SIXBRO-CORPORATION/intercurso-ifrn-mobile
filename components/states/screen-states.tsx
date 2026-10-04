import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { colors, spacing } from '@/theme';


export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
    return (
        <View style={styles.container} accessibilityLiveRegion="polite">
            <ActivityIndicator color={colors.secondaryLabel as string} />
            <ThemedText variant="subhead">{label}</ThemedText>
        </View>
    );
}

interface ErrorStateProps {
    title: string;
    description: string;
    onRetry?: () => void;
    retrying?: boolean;
}

export function ErrorState({ title, description, onRetry, retrying = false }: ErrorStateProps) {
    return (
        <View style={styles.container} accessibilityRole="alert">
            <ThemedText variant="title" style={styles.centered}>
                {title}
            </ThemedText>
            <ThemedText variant="subhead" style={styles.centered}>
                {description}
            </ThemedText>
            {onRetry ? (
                <Button title="Tentar de novo" variant="secondary" onPress={onRetry} loading={retrying} />
            ) : null}
        </View>
    );
}

interface EmptyStateProps {
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <View style={styles.container}>
            <ThemedText variant="title" style={styles.centered}>
                {title}
            </ThemedText>
            {description ? (
                <ThemedText variant="subhead" style={styles.centered}>
                    {description}
                </ThemedText>
            ) : null}
            {actionLabel && onAction ? (
                <Button title={actionLabel} variant="ghost" onPress={onAction} />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        gap: spacing.sm,
    },
    centered: {
        textAlign: 'center',
    },
});
