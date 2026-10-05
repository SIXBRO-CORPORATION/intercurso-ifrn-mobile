import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/providers/ToastProvider';
import { spacing } from '@/theme';
import { AuthCancelledError } from '@/types/auth';

export function LoginPrompt({ message }: { message: string }) {
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
            <ThemedText variant="subhead" style={styles.text}>
                {message}
            </ThemedText>
            <Button title="Entrar com SUAP" loading={isLoading} onPress={handleLogin} style={styles.button} />
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
    text: {
        textAlign: 'center',
    },
    button: {
        minWidth: 200,
    },
});
