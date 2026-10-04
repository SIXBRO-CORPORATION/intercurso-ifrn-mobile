import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MenuView, type NativeActionEvent } from '@expo/ui/community/menu';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/providers/ToastProvider';
import { onTint, spacing, useBrandColors } from '@/theme';
import { AuthCancelledError } from '@/types/auth';

const AVATAR_SIZE = spacing.xl;

const MIN_TOUCH_TARGET = 44;

function getInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export function AvatarMenu() {
    const { user, isAuthenticated, loginWithSuap, logout } = useAuth();
    const toast = useToast();
    const brand = useBrandColors();

    const handleLogin = useCallback(async () => {
        try {
            await loginWithSuap();
        } catch (error) {
            if (error instanceof AuthCancelledError) {
                return;
            }

            const message =
                error instanceof Error ? error.message : 'Não foi possível concluir o login com o SUAP';
            toast.error(message);
        }
    }, [loginWithSuap, toast]);

    const handleLogout = useCallback(async () => {
        await logout();
        toast.info('Sessão encerrada');
    }, [logout, toast]);

    const actions = useMemo(
        () =>
            isAuthenticated
                ? [
                      { id: 'profile', title: 'Perfil' },
                      { id: 'logout', title: 'Sair', attributes: { destructive: true } },
                  ]
                : [{ id: 'login', title: 'Entrar com SUAP' }],
        [isAuthenticated]
    );

    const handlePressAction = useCallback(
        ({ nativeEvent }: NativeActionEvent) => {
            switch (nativeEvent.event) {
                case 'profile':
                    router.push('/profile');
                    break;
                case 'logout':
                    handleLogout();
                    break;
                case 'login':
                    handleLogin();
                    break;
            }
        },
        [handleLogin, handleLogout]
    );

    return (
        <MenuView actions={actions} onPressAction={handlePressAction} style={styles.trigger}>
            <View
                accessible
                accessibilityRole="button"
                accessibilityLabel={isAuthenticated ? `Menu de ${user?.name}` : 'Entrar'}
                style={styles.touchTarget}
            >
                <View
                    style={[
                        styles.avatar,
                        {
                            backgroundColor: isAuthenticated ? brand.primary : 'transparent',
                            borderColor: brand.primary,
                        },
                    ]}
                >
                    <ThemedText variant="caption" style={{ color: isAuthenticated ? onTint : brand.primary }}>
                        {isAuthenticated && user ? getInitials(user.name) : '?'}
                    </ThemedText>
                </View>
            </View>
        </MenuView>
    );
}

const styles = StyleSheet.create({
    trigger: {
        marginRight: spacing.xs,
    },
    touchTarget: {
        minWidth: MIN_TOUCH_TARGET,
        minHeight: MIN_TOUCH_TARGET,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
