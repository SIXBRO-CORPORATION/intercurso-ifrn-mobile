import { useCallback, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Button } from '@/components/button';
import { LoginPrompt } from '@/components/auth/login-prompt';
import { Toggle } from '@/components/form/toggle';
import { Icon, type IconName } from '@/components/icon';
import { LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/providers/ToastProvider';
import { colors, radius, spacing } from '@/theme';
import { UserRoleLabel } from '@/types/enums';
import { formatCampusLabel } from '@/utils/campus-label';

const APP_NAME = Constants.expoConfig?.name ?? 'Intercurso IFRN';
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

const APP_DISPLAY_NAME = 'Intercurso 2026';

const AVATAR_SIZE = 96;
const MENU_ICON_SIZE = 40;

function firstInitial(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
}

export default function ProfileScreen() {
    const { user, isAuthenticated, isInitializing, isLoading, logout } = useAuth();
    const toast = useToast();

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const handleLogout = useCallback(async () => {
        await logout();
        toast.info('Sessão encerrada');
    }, [logout, toast]);

    const handleOpenRegulation = useCallback(() => {
        toast.info('Regulamento em breve por aqui');
    }, [toast]);

    const handleOpenAbout = useCallback(() => {
        Alert.alert(APP_NAME, `Versão ${APP_VERSION}\n\nApp oficial do Intercurso IFRN.`);
    }, []);

    if (isInitializing) {
        return <LoadingState label="Carregando perfil…" />;
    }

    if (!isAuthenticated || !user) {
        return <LoginPrompt message="Entre com sua conta SUAP para ver seu perfil." />;
    }

    const subtitle = [UserRoleLabel[user.role], formatCampusLabel(user.campus)].filter(Boolean).join(' · ');

    return (
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
            <ThemedText variant="largeTitle">Perfil</ThemedText>

            <View style={styles.identityCard}>
                <View style={styles.avatarWrap}>
                    <View style={styles.avatar}>
                        <ThemedText variant="largeTitle" style={styles.avatarInitial}>
                            {firstInitial(user.name)}
                        </ThemedText>
                    </View>
                    {user.active ? (
                        <View style={styles.verifiedBadge} accessibilityLabel="Conta ativa">
                            <Icon name="check" size={14} color={colors.surface} strokeWidth={3} />
                        </View>
                    ) : null}
                </View>
                <ThemedText variant="heading" style={styles.name} numberOfLines={1}>
                    {user.name}
                </ThemedText>
                {subtitle ? (
                    <ThemedText variant="body" style={styles.subtitle}>
                        {subtitle}
                    </ThemedText>
                ) : null}
            </View>

            <View style={styles.menu}>
                {user.role === 'USER' ? (
                    <>
                        <MenuRow icon="users" label="Minhas equipes" onPress={() => router.push('/(teams)')} />
                        <Divider />
                    </>
                ) : null}
                <MenuRow
                    icon="bell"
                    label="Notificações push"
                    trailing={
                        <Toggle
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            accessibilityLabel="Notificações push"
                        />
                    }
                />
                <Divider />
                <MenuRow icon="file" label="Regulamento" onPress={handleOpenRegulation} />
                <Divider />
                <MenuRow icon="info" label="Sobre o app" onPress={handleOpenAbout} />
            </View>

            <Button
                title="Sair da conta"
                variant="dangerSoft"
                icon="logout"
                loading={isLoading}
                onPress={handleLogout}
            />

            <ThemedText variant="caption" style={styles.footer}>
                {APP_DISPLAY_NAME} · v{APP_VERSION}
            </ThemedText>
        </ScrollView>
    );
}

interface MenuRowProps {
    icon: IconName;
    label: string;
    trailing?: ReactNode;
    onPress?: () => void;
}

function MenuRow({ icon, label, trailing, onPress }: MenuRowProps) {
    const content = (
        <View style={styles.menuRow}>
            <View style={styles.menuIconBubble}>
                <Icon name={icon} size={20} color={colors.primaryDark} />
            </View>
            <ThemedText variant="body" style={styles.menuLabel} numberOfLines={1}>
                {label}
            </ThemedText>
            {trailing ?? (onPress ? <Icon name="chev_r" size={20} color={colors.textMuted} /> : null)}
        </View>
    );

    if (!onPress) {
        return content;
    }

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            style={({ pressed }) => (pressed ? styles.menuRowPressed : undefined)}
        >
            {content}
        </Pressable>
    );
}

function Divider() {
    return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
    content: {
        flexGrow: 1,
        padding: spacing.lg,
        gap: spacing.lg,
    },
    identityCard: {
        alignItems: 'center',
        gap: spacing.xxs,
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.xl,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    avatarWrap: {
        marginBottom: spacing.sm,
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primarySoft,
    },
    avatarInitial: {
        color: colors.primaryDark,
        fontSize: 40,
        lineHeight: 44,
    },
    verifiedBadge: {
        position: 'absolute',
        right: -2,
        bottom: -2,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderWidth: 3,
        borderColor: colors.surface,
    },
    name: {
        textAlign: 'center',
    },
    subtitle: {
        color: colors.textSecondary,
        textAlign: 'center',
    },
    menu: {
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
        paddingHorizontal: spacing.md,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 64,
    },
    menuRowPressed: {
        opacity: 0.6,
    },
    menuIconBubble: {
        width: MENU_ICON_SIZE,
        height: MENU_ICON_SIZE,
        borderRadius: MENU_ICON_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
    },
    menuLabel: {
        flex: 1,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginLeft: MENU_ICON_SIZE + spacing.md,
        backgroundColor: colors.border,
    },
    footer: {
        textAlign: 'center',
        color: colors.textMuted,
    },
});
