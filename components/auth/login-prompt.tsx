import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/button';
import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/providers/ToastProvider';
import { colors, radius, spacing } from '@/theme';
import { AuthCancelledError } from '@/types/auth';

interface LoginPromptProps {
    message: string;
    title?: string;
    icon?: IconName;
}

export function LoginPrompt({ message, title = 'Entre para participar', icon = 'users' }: LoginPromptProps) {
    const { isLoading, loginWithSuap } = useAuth();
    const toast = useToast();

    const handleLogin = useCallback(async () => {
        try {
            await loginWithSuap();
        } catch (error) {
            if (error instanceof AuthCancelledError) return;

            toast.error(error instanceof Error ? error.message : 'Não foi possível concluir o login com o SUAP');
        }
    }, [loginWithSuap, toast]);

    return (
        <View style={styles.center}>
            <View style={styles.iconRing}>
                <View style={styles.iconRingInner}>
                    <Icon name={icon} size={40} color={colors.primary} />
                </View>
                <View style={styles.lockBadge}>
                    <Icon name="lock" size={16} color={colors.surface} />
                </View>
            </View>

            <ThemedText variant="title" style={styles.title}>
                {title}
            </ThemedText>
            <ThemedText variant="body" style={styles.description}>
                {message}
            </ThemedText>

            <View style={styles.actions}>
                <Button title="Entrar com SUAP" icon="lock" loading={isLoading} onPress={handleLogin} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        gap: spacing.sm,
    },
    iconRing: {
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    iconRingInner: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lockBadge: {
        position: 'absolute',
        top: -2,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: colors.background,
    },
    title: {
        textAlign: 'center',
    },
    description: {
        textAlign: 'center',
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    actions: {
        width: '100%',
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
});
