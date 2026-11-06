import type { Ref } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { colors, fontFamily, radius, spacing } from '@/theme';

type TabButtonProps = TabTriggerSlotProps & {
    icon: IconName;
    label: string;
    ref?: Ref<View>;
};

function TabButton({ icon, label, isFocused, ref, ...props }: TabButtonProps) {
    const tint = isFocused ? colors.primary : colors.textMuted;

    return (
        <Pressable
            {...props}
            ref={ref}
            style={styles.trigger}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={label}
        >
            <View style={styles.divider} />
            {isFocused ? <View style={styles.activeDivider} /> : null}
            <View style={[styles.iconPill, isFocused && styles.iconPillActive]}>
                <Icon name={icon} size={24} color={tint} strokeWidth={isFocused ? 2.4 : 2.2} />
            </View>
            <ThemedText
                variant="caption"
                style={{ color: tint, fontFamily: isFocused ? fontFamily.bold : fontFamily.medium }}
            >
                {label}
            </ThemedText>
        </Pressable>
    );
}

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const canManage = user?.role === 'MONITOR' || user?.role === 'ADMIN';

    return (
        <Tabs style={styles.root}>
            <TabSlot />
            <TabList asChild>
                <View style={StyleSheet.flatten([styles.tabList, { paddingBottom: Math.max(insets.bottom, spacing.xs) }])}>
                    {canManage ? (
                        <>
                            <TabTrigger name="panel" href="/(management)" asChild>
                                <TabButton icon="grid" label="Painel" />
                            </TabTrigger>
                            <TabTrigger name="management-teams" href="/(management-teams)/teams" asChild>
                                <TabButton icon="users" label="Equipes" />
                            </TabTrigger>
                            <TabTrigger name="brackets" href="/(brackets)" asChild>
                                <TabButton icon="bracket" label="Chaves" />
                            </TabTrigger>
                            <TabTrigger name="matches" href="/(management-matches)/matches" asChild>
                                <TabButton icon="ball" label="Partidas" />
                            </TabTrigger>
                            <TabTrigger name="profile" href="/profile" asChild>
                                <TabButton icon="user" label="Perfil" />
                            </TabTrigger>
                        </>
                    ) : (
                        <>
                            <TabTrigger name="games" href="/(games)" asChild>
                                <TabButton icon="ball" label="Jogos" />
                            </TabTrigger>
                            <TabTrigger name="brackets" href="/(brackets)" asChild>
                                <TabButton icon="bracket" label="Chaves" />
                            </TabTrigger>
                            <TabTrigger name="teams" href="/(teams)" asChild>
                                <TabButton icon="users" label="Equipes" />
                            </TabTrigger>
                            <TabTrigger name="profile" href="/profile" asChild>
                                <TabButton icon="user" label="Perfil" />
                            </TabTrigger>
                        </>
                    )}
                </View>
            </TabList>
        </Tabs>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.background,
    },
    tabList: {
        flexDirection: 'row',
        backgroundColor: colors.background,
    },
    trigger: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xxs,
        paddingTop: spacing.xs,
        paddingBottom: spacing.xxs,
    },
    divider: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: colors.border,
    },
    activeDivider: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: colors.primary,
    },
    iconPill: {
        width: 56,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.pill,
    },
    iconPillActive: {
        backgroundColor: colors.background,
    },
});
