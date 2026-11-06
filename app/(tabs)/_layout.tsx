import { createContext, use, useEffect, type Ref } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { colors, fontFamily, motion, radius, spacing } from '@/theme';

const NOT_SET = -1;

const ActiveTabIndexContext = createContext<SharedValue<number> | null>(null);

type TabButtonProps = TabTriggerSlotProps & {
    icon: IconName;
    label: string;
    index: number;
    ref?: Ref<View>;
};

function TabButton({ icon, label, index, isFocused, ref, ...props }: TabButtonProps) {
    const activeIndex = use(ActiveTabIndexContext);
    const tint = isFocused ? colors.primary : colors.textMuted;

    useEffect(() => {
        if (!isFocused || !activeIndex) return;
        const isFirstRender = activeIndex.value === NOT_SET;
        activeIndex.value = isFirstRender
            ? index
            : withTiming(index, { duration: motion.base, easing: motion.easing });
    }, [isFocused, index, activeIndex]);

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
    const tabCount = canManage ? 5 : 4;

    const activeIndex = useSharedValue(NOT_SET);
    const tabWidth = useSharedValue(0);

    const handleTabListLayout = (event: LayoutChangeEvent) => {
        tabWidth.value = event.nativeEvent.layout.width / tabCount;
    };

    const indicatorStyle = useAnimatedStyle(() => ({
        width: tabWidth.value,
        opacity: activeIndex.value === NOT_SET ? 0 : 1,
        transform: [{ translateX: activeIndex.value * tabWidth.value }],
    }));

    return (
        <ActiveTabIndexContext value={activeIndex}>
            <Tabs style={styles.root}>
                <TabSlot />
                <TabList asChild>
                    <View
                        onLayout={handleTabListLayout}
                        style={StyleSheet.flatten([styles.tabList, { paddingBottom: Math.max(insets.bottom, spacing.xs) }])}
                    >
                        <Animated.View style={[styles.activeDivider, indicatorStyle]} />
                        {canManage ? (
                            <>
                                <TabTrigger name="panel" href="/(management)" asChild>
                                    <TabButton index={0} icon="grid" label="Painel" />
                                </TabTrigger>
                                <TabTrigger name="management-teams" href="/(management-teams)/teams" asChild>
                                    <TabButton index={1} icon="users" label="Equipes" />
                                </TabTrigger>
                                <TabTrigger name="brackets" href="/(brackets)" asChild>
                                    <TabButton index={2} icon="bracket" label="Chaves" />
                                </TabTrigger>
                                <TabTrigger name="matches" href="/(management-matches)/matches" asChild>
                                    <TabButton index={3} icon="ball" label="Partidas" />
                                </TabTrigger>
                                <TabTrigger name="profile" href="/profile" asChild>
                                    <TabButton index={4} icon="user" label="Perfil" />
                                </TabTrigger>
                            </>
                        ) : (
                            <>
                                <TabTrigger name="games" href="/(games)" asChild>
                                    <TabButton index={0} icon="ball" label="Jogos" />
                                </TabTrigger>
                                <TabTrigger name="brackets" href="/(brackets)" asChild>
                                    <TabButton index={1} icon="bracket" label="Chaves" />
                                </TabTrigger>
                                <TabTrigger name="teams" href="/(teams)" asChild>
                                    <TabButton index={2} icon="users" label="Equipes" />
                                </TabTrigger>
                                <TabTrigger name="profile" href="/profile" asChild>
                                    <TabButton index={3} icon="user" label="Perfil" />
                                </TabTrigger>
                            </>
                        )}
                    </View>
                </TabList>
            </Tabs>
        </ActiveTabIndexContext>
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
        height: 2,
        pointerEvents: 'none',
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
