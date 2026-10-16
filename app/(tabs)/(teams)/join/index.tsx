import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { FormField } from '@/components/form/form-field';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { colors, radius, spacing } from '@/theme';
import { extractInviteToken } from '@/utils/team-invite';

export default function JoinWithCodeScreen() {
    const [value, setValue] = useState('');
    const [error, setError] = useState<string | undefined>();

    const handleContinue = () => {
        const token = extractInviteToken(value);
        if (!token) {
            setError('Cole o código ou o link de convite que você recebeu.');
            return;
        }

        setError(undefined);
        router.push(`/join/${encodeURIComponent(token)}`);
    };

    return (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <View style={[styles.iconBubble, styles.selfCenter]}>
                <Icon name="link" size={28} color={colors.primaryDark} />
            </View>

            <ThemedText variant="heading" style={styles.centered}>
                Entrar com link ou código
            </ThemedText>
            <ThemedText variant="body" style={[styles.centered, styles.muted]}>
                Se você abriu o link de convite no celular, o app já mostra o time automaticamente. Caso contrário,
                cole aqui o link ou o código enviado pelo dono do time.
            </ThemedText>

            <FormField
                label="Link ou código do convite"
                value={value}
                onChangeText={setValue}
                autoCapitalize="none"
                autoCorrect={false}
                error={error}
            />

            <Button title="Continuar" onPress={handleContinue} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        flexGrow: 1,
        padding: spacing.xl,
        paddingTop: spacing.xxl,
        gap: spacing.md,
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
    selfCenter: {
        alignSelf: 'center',
    },
    centered: {
        textAlign: 'center',
    },
    muted: {
        color: colors.textSecondary,
    },
});
