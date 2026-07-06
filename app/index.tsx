import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../providers/ToastProvider';
import { AuthCancelledError } from '../types/auth';

export default function Home() {
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
                <Text style={styles.title}>Intercurso IFRN</Text>
                <Text style={styles.subtitle}>Entre com sua conta SUAP para continuar</Text>

                <Pressable style={styles.button} onPress={handleLogin} disabled={isLoading}>
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Entrar com SUAP</Text>
                    )}
                </Pressable>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.profile}>
            <Text style={styles.title}>Olá, {user.name}</Text>

            <View style={styles.card}>
                <InfoRow label="Matrícula" value={String(user.matricula)} />
                <InfoRow label="Email" value={user.email ?? '-'} />
                <InfoRow label="Perfil" value={user.role} />
                <InfoRow label="Atleta" value={user.atleta ? 'Sim' : 'Não'} />
                <InfoRow label="Ativo" value={user.active ? 'Sim' : 'Não'} />
            </View>

            <Pressable style={[styles.button, styles.logoutButton]} onPress={handleLogout} disabled={isLoading}>
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Sair</Text>
                )}
            </Pressable>
        </ScrollView>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 16,
    },
    profile: {
        flexGrow: 1,
        padding: 24,
        gap: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        opacity: 0.7,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#1a73e8',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 200,
    },
    logoutButton: {
        backgroundColor: '#d93025',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    card: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    rowLabel: {
        opacity: 0.6,
    },
    rowValue: {
        fontWeight: '600',
    },
});
