import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { FormField } from '@/components/form/form-field';
import { ThemedText } from '@/components/themed-text';
import { spacing } from '@/theme';
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
            <ThemedText variant="subhead">
                Se você abriu o link de convite no celular, o app já mostra o time automaticamente. Caso contrário, cole
                aqui o link ou o código enviado pelo dono do time.
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
        padding: spacing.md,
        gap: spacing.md,
    },
});
