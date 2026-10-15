import { useCallback } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/providers/ToastProvider';
import { colors, radius, shadows, spacing } from '@/theme';
import { AuthCancelledError } from '@/types/auth';

export default function WelcomeScreen() {
    const insets = useSafeAreaInsets();
    const { isLoading, loginWithSuap, continueAsVisitor } = useAuth();
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
        <View style={styles.root}>
            <LinearGradient
                colors={colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.hero, { paddingTop: insets.top + spacing.xxl }]}
            >
                <Image
                    source={require('../assets/logo-intercurso-branca.png')}
                    style={styles.logo}
                    resizeMode="contain"
                    accessibilityIgnoresInvertColors
                />
                <ThemedText variant="bodyLg" style={styles.tagline}>
                    Seu campeonato, num só app.
                </ThemedText>
            </LinearGradient>

            <View style={styles.sheet}>
                <ThemedText variant="title">Bem-vindo(a)!</ThemedText>
                <ThemedText variant="body" style={styles.description}>
                    Acompanhe os jogos ao vivo sem conta. Entre com o SUAP para criar ou participar de uma equipe.
                </ThemedText>

                <View style={styles.actions}>
                    <Button title="Entrar com SUAP" icon="lock" loading={isLoading} onPress={handleLogin} />
                    <Button title="Continuar como visitante" variant="outline" onPress={continueAsVisitor} />
                </View>

                <ThemedText variant="caption" style={styles.footer}>
                    IFRN · CAMPUS PAU DOS FERROS
                </ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.primary,
    },
    hero: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xxl,
    },
    logo: {
        width: 200,
        height: 200,
    },
    tagline: {
        color: colors.surface,
        textAlign: 'center',
    },
    sheet: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: radius.hero,
        borderTopRightRadius: radius.hero,
        boxShadow: shadows.sheet,
        padding: spacing.xl,
        paddingBottom: spacing.xxl,
        gap: spacing.sm,
    },
    description: {
        color: colors.textSecondary,
    },
    actions: {
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    footer: {
        textAlign: 'center',
        color: colors.textMuted,
        marginTop: spacing.md,
    },
});
