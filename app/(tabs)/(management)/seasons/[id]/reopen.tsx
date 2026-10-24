import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/button';
import { DateField } from '@/components/form/date-field';
import { ManagementGuard } from '@/components/management/management-guard';
import { ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useReopenSeasonRegistration, useSeasonDetails } from '@/hooks/useSeasons';
import type { SeasonDetails } from '@/types/season';
import { colors, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { pickerDateToIso } from '@/utils/campus-time';

function ReopenForm({ season }: { season: SeasonDetails }) {
    const reopen = useReopenSeasonRegistration();

    const registrationStart = season.registration_start_date ? new Date(season.registration_start_date) : null;
    const minimumEnd = registrationStart && registrationStart.getTime() > Date.now() ? registrationStart : new Date();

    const [end, setEnd] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const [error, setError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (reopen.isPending) return;

        const endIso = pickerDateToIso(end, true);
        const endTime = Date.parse(endIso);

        if (endTime <= Date.now()) {
            setError('Escolha uma data de encerramento no futuro.');
            return;
        }

        if (registrationStart && endTime <= registrationStart.getTime()) {
            setError('O encerramento deve ser depois da abertura das inscrições.');
            return;
        }

        setError(null);
        setSubmitError(null);

        try {
            await reopen.mutateAsync({ seasonId: season.season_id, request: { new_registration_end_date: endIso } });
            router.back();
        } catch (e) {
            setSubmitError(friendlyErrorMessage(e, 'Não foi possível reabrir as inscrições.'));
        }
    };

    return (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <ThemedText variant="section">{season.name}</ThemedText>
            <ThemedText variant="body" style={styles.intro}>
                As equipes em rascunho poderão ser submetidas de novo. Defina quando as inscrições encerram.
            </ThemedText>

            <DateField
                label="Novo fim das inscrições"
                value={end}
                onChange={setEnd}
                minimumDate={minimumEnd}
                hint="Inclui o dia inteiro, no horário de Brasília."
                error={error ?? undefined}
            />

            {submitError ? (
                <ThemedText variant="caption" accessibilityRole="alert" style={styles.errorText}>
                    {submitError}
                </ThemedText>
            ) : null}

            <Button title="Reabrir inscrições" onPress={handleSubmit} loading={reopen.isPending} />
        </ScrollView>
    );
}

function ReopenContent() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const details = useSeasonDetails(id);

    if (details.isPending) return <LoadingState label="Carregando temporada…" />;

    if (details.isError) {
        return (
            <ErrorState
                title="Não foi possível carregar a temporada"
                description={friendlyErrorMessage(details.error, 'Tente de novo.')}
                onRetry={() => details.refetch()}
                retrying={details.isRefetching}
            />
        );
    }

    return <ReopenForm season={details.data} />;
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
    intro: {
        color: colors.textSecondary,
    },
    errorText: {
        color: colors.danger,
    },
});
