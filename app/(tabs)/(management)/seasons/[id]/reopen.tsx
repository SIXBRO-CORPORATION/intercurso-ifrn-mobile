import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/button';
import { DateField } from '@/components/form/date-field';
import { ManagementGuard } from '@/components/management/management-guard';
import { ThemedText } from '@/components/themed-text';
import { useReopenSeasonRegistration } from '@/hooks/useSeasons';
import { spacing, useBrandColors } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { pickerDateToIso } from '@/utils/campus-time';

function ReopenContent() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const brand = useBrandColors();
    const reopen = useReopenSeasonRegistration();

    const [end, setEnd] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const [error, setError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (reopen.isPending) return;

        const endIso = pickerDateToIso(end, true);
        if (Date.parse(endIso) <= Date.now()) {
            setError('Escolha uma data de encerramento no futuro.');
            return;
        }

        setError(null);
        setSubmitError(null);

        try {
            await reopen.mutateAsync({ seasonId: id, request: { new_registration_end_date: endIso } });
            router.back();
        } catch (e) {
            setSubmitError(friendlyErrorMessage(e, 'Não foi possível reabrir as inscrições.'));
        }
    };

    return (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <ThemedText variant="subhead">
                As equipes em rascunho poderão ser submetidas de novo. Defina quando as inscrições encerram.
            </ThemedText>

            <DateField
                label="Novo fim das inscrições"
                value={end}
                onChange={setEnd}
                minimumDate={new Date()}
                hint="Inclui o dia inteiro, no horário de Natal."
                error={error ?? undefined}
            />

            {submitError ? (
                <ThemedText variant="caption" accessibilityRole="alert" style={{ color: brand.primary }}>
                    {submitError}
                </ThemedText>
            ) : null}

            <Button title="Reabrir inscrições" onPress={handleSubmit} loading={reopen.isPending} />
        </ScrollView>
    );
}

export default function ReopenRegistrationScreen() {
    return (
        <ManagementGuard>
            <ReopenContent />
        </ManagementGuard>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        gap: spacing.md,
    },
});
