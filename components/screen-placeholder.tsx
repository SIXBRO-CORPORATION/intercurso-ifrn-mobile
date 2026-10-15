import { ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { colors, spacing } from '@/theme';

interface ScreenPlaceholderProps {
    title: string;
    description: string;
}

export function ScreenPlaceholder({ title, description }: ScreenPlaceholderProps) {
    return (
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
            <ThemedText variant="title" style={styles.centered}>
                {title}
            </ThemedText>
            <ThemedText variant="body" style={[styles.centered, styles.description]}>
                {description}
            </ThemedText>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        gap: spacing.sm,
    },
    centered: {
        textAlign: 'center',
    },
    description: {
        color: colors.textSecondary,
        maxWidth: 280,
    },
});
