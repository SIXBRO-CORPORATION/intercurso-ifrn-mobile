import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { colors, radius, spacing } from '@/theme';

export default function NotFoundScreen() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                <View style={styles.iconBubble}>
                    <Icon name="search" size={28} color={colors.primaryDark} />
                </View>
                <ThemedText variant="heading" style={styles.centered}>
                    Página não encontrada
                </ThemedText>
                <ThemedText variant="body" style={[styles.centered, styles.description]}>
                    O link que você acessou não existe ou não está mais disponível.
                </ThemedText>
                <Button
                    title="Voltar para o início"
                    variant="soft"
                    size="compact"
                    onPress={() => router.replace('/')}
                    style={styles.action}
                />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        padding: spacing.xl,
        gap: spacing.sm,
    },
    iconBubble: {
        width: 64,
        height: 64,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primarySoft,
        marginBottom: spacing.xs,
    },
    centered: {
        textAlign: 'center',
    },
    description: {
        color: colors.textSecondary,
        maxWidth: 280,
    },
    action: {
        marginTop: spacing.md,
    },
});
