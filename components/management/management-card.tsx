import { Pressable, StyleSheet, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { colors, radius, spacing } from '@/theme';

interface ManagementCardProps {
    title: string;
    subtitle?: string;
    href: Href;
    icon?: IconName;
}

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
                                <Icon name={icon} size={22} color={colors.primaryDark} />
                            </View>
                        ) : null}
                        <View style={styles.texts}>
                            <ThemedText variant="section" style={styles.left}>
                                {title}
                            </ThemedText>
                            {subtitle ? (
                                <ThemedText variant="bodySm" style={styles.left}>
                                    {subtitle}
                                </ThemedText>
                            ) : null}
                        </View>
                        <Icon name="chev_r" size={20} color={colors.textMuted} />
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
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    iconBubble: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primarySoft,
    },
    texts: {
        flex: 1,
        alignItems: 'flex-start',
        gap: spacing.xxs,
    },
    left: {
        textAlign: 'left',
        alignSelf: 'stretch',
    },
});
