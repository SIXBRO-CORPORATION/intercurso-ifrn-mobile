import { Pressable, StyleSheet, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { colors, fontFamily, radius, spacing } from '@/theme';

type ManagementCardProps = {
    title: string;
    subtitle?: string;
    href: Href;
    icon?: IconName;
};

export function ManagementCard({ title, subtitle, href, icon }: ManagementCardProps) {
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
                        {icon ? (
                            <View style={styles.iconBubble}>
                                <Icon name={icon} size={20} color={colors.primary} />
                            </View>
                        ) : null}
                        <View style={styles.texts}>
                            <ThemedText variant="bodySm" style={styles.title} numberOfLines={1}>
                                {title}
                            </ThemedText>
                            {subtitle ? (
                                <ThemedText variant="caption" style={styles.subtitle} numberOfLines={2}>
                                    {subtitle}
                                </ThemedText>
                            ) : null}
                        </View>
                    </View>
                )}
            </Pressable>
        </Link>
    );
}

const styles = StyleSheet.create({
    card: {
        alignItems: 'center',
        gap: spacing.xs,
        minHeight: 112,
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    iconBubble: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
    },
    texts: {
        alignItems: 'center',
        gap: 2,
    },
    title: {
        fontFamily: fontFamily.bold,
        textAlign: 'center',
    },
    subtitle: {
        textAlign: 'center',
    },
});
