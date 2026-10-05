import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/button';
import { FormField } from '@/components/form/form-field';
import { ManagementGuard } from '@/components/management/management-guard';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useFinishSeason, useSeasonDetails } from '@/hooks/useSeasons';
import type { SeasonDetails } from '@/types/season';
import { spacing, useBrandColors } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';

function FinishForm({ season }: { season: SeasonDetails }) {
    const brand = useBrandColors();
    const finish = useFinishSeason();
    const [confirmation, setConfirmation] = useState('');
    const [submitError, setSubmitError] = useState<string | null>(null);

    const matches = confirmation === season.name;

    const handleSubmit = async () => {
        if (!matches || finish.isPending) return;
        setSubmitError(null);

        try {
            await finish.mutateAsync({ seasonId: season.season_id, request: { confirmation_name: confirmation } });
            router.back();
        } catch (error) {
            setSubmitError(friendlyErrorMessage(error, 'Não foi possível finalizar a temporada.'));
        }
    };

    return (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <ThemedText variant="headline">Esta ação não pode ser desfeita.</ThemedText>
            <ThemedText variant="subhead">
                A temporada passa a Finalizada, todos os convites de equipes são desativados e nenhuma alteração será
                permitida depois disso.
            </ThemedText>

            <FormField
                label={`Digite “${season.name}” para confirmar`}
                value={confirmation}
                onChangeText={setConfirmation}
                autoCapitalize="none"
                autoCorrect={false}
                error={confirmation.length > 0 && !matches ? 'O nome precisa ser idêntico ao da temporada.' : undefined}
            />

            {submitError ? (
                <ThemedText variant="caption" accessibilityRole="alert" style={{ color: brand.primary }}>
                    {submitError}
                </ThemedText>
            ) : null}

            <Button
                title="Finalizar temporada"
                variant="destructive"
                disabled={!matches}
                loading={finish.isPending}
                onPress={handleSubmit}
            />
        </ScrollView>
    );
}

function FinishContent() {
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

    if (details.data.status !== 'IN_PROGRESS') {
        return (
            <EmptyState
                title="Temporada não está em andamento"
                description="Só é possível finalizar uma temporada com status Em progresso."
                actionLabel="Voltar"
                onAction={() => router.back()}
            />
        );
    }

    return <FinishForm season={details.data} />;
}

export default function FinishSeasonScreen() {
    return (
        <ManagementGuard>
            <FinishContent />
        </ManagementGuard>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        gap: spacing.md,
    },
});
