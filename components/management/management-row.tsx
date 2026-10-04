import { Pressable, StyleSheet, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { colors, spacing } from '@/theme';

interface ManagementRowProps {
    title: string;
    subtitle?: string;
    href: Href;
}

export function ManagementRow({ title, subtitle, href }: ManagementRowProps) {
    return (
        <Link href={href} asChild>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
                style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
            >
                <View style={styles.texts}>
                    <ThemedText variant="headline">{title}</ThemedText>
                    {subtitle ? <ThemedText variant="subhead">{subtitle}</ThemedText> : null}
                </View>
                <ThemedText variant="headline" style={styles.chevron}>
                    ›
                </ThemedText>
            </Pressable>
        </Link>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        minHeight: 56,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    texts: {
        flex: 1,
        gap: 2,
    },
    chevron: {
        color: colors.separator as string,
    },
});
