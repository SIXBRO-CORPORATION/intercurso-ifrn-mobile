import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/providers/ToastProvider';
import { colors, radius, spacing } from '@/theme';
import { AuthCancelledError } from '@/types/auth';

export default function ProfileScreen() {
    const { user, isAuthenticated, isInitializing, isLoading, loginWithSuap, logout } = useAuth();
    const toast = useToast();

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

    if (isInitializing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <View style={styles.center}>
                <ThemedText variant="subhead" style={styles.centered}>
                    Entre com sua conta SUAP para ver seu perfil
                </ThemedText>
                <Button title="Entrar com SUAP" loading={isLoading} onPress={handleLogin} style={styles.button} />
            </View>
        );
    }

    return (
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.profile}>
            <View style={styles.card}>
                <InfoRow label="Nome" value={user.name} />
                <InfoRow label="Matrícula" value={String(user.matricula)} />
                <InfoRow label="Email" value={user.email ?? '-'} />
                <InfoRow label="Perfil" value={user.role} />
                <InfoRow label="Atleta" value={user.atleta ? 'Sim' : 'Não'} />
                <InfoRow label="Ativo" value={user.active ? 'Sim' : 'Não'} />
            </View>

            <Button title="Sair" variant="destructive" loading={isLoading} onPress={handleLogout} />
        </ScrollView>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.row}>
            <ThemedText variant="subhead">{label}</ThemedText>
            <ThemedText variant="headline" selectable style={styles.value}>
                {value}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        gap: spacing.md,
    },
    profile: {
        flexGrow: 1,
        padding: spacing.lg,
        gap: spacing.md,
    },
    centered: {
        textAlign: 'center',
    },
    button: {
        minWidth: 200,
    },
    card: {
        borderWidth: 1,
        borderColor: colors.separator,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        padding: spacing.md,
        gap: spacing.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    value: {
        flexShrink: 1,
        textAlign: 'right',
    },
});
