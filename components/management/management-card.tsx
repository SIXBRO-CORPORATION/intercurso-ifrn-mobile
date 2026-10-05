import { Pressable, StyleSheet, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { colors, radius, shadows, spacing } from '@/theme';

interface ManagementCardProps {
    title: string;
    subtitle?: string;
    href: Href;
}

export function ManagementCard({ title, subtitle, href }: ManagementCardProps) {
    return (
        <Link href={href} asChild>
            <Pressable accessibilityRole="button" accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}>
                {({ pressed }) => (
                    <View
                        style={[
                            styles.card,
                            { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
                        ]}
                    >
                        <View style={styles.texts}>
                            <ThemedText variant="headline" style={styles.left}>
                                {title}
                            </ThemedText>
                            {subtitle ? (
                                <ThemedText variant="subhead" style={styles.left}>
                                    {subtitle}
                                </ThemedText>
                            ) : null}
                        </View>
                        <ThemedText variant="title" style={styles.chevron}>
                            ›
                        </ThemedText>
                    </View>
                )}
            </Pressable>
        </Link>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 72,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.secondarySystemBackground as string,
        boxShadow: shadows.card,
    },
    texts: {
        flex: 1,
        alignItems: 'flex-start',
        gap: spacing.xs,
    },
    left: {
        textAlign: 'left',
        alignSelf: 'stretch',
    },
    chevron: {
        color: colors.secondaryLabel as string,
    },
});
