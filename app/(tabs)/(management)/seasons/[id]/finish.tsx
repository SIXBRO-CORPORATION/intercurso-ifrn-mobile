import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/button';
import { FormField } from '@/components/form/form-field';
import { Icon } from '@/components/icon';
import { ManagementGuard } from '@/components/management/management-guard';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useFinishSeason, useSeasonDetails } from '@/hooks/useSeasons';
import type { SeasonDetails } from '@/types/season';
import { colors, radius, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';

function FinishForm({ season }: { season: SeasonDetails }) {
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
            <View style={styles.iconBubble}>
                <Icon name="warn" size={28} color={colors.danger} />
            </View>

            <ThemedText variant="heading" style={styles.centered}>
                Finalizar temporada?
            </ThemedText>
            <ThemedText variant="body" style={[styles.centered, styles.description]}>
                Todas as atividades serão encerradas e os convites de equipe, desativados. Essa ação não pode ser
                desfeita.
            </ThemedText>

            <FormField
                label={`Digite “${season.name}” para confirmar`}
                value={confirmation}
                onChangeText={setConfirmation}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={season.name}
                error={confirmation.length > 0 && !matches ? 'O nome precisa ser idêntico ao da temporada.' : undefined}
            />

            {submitError ? (
                <ThemedText variant="caption" accessibilityRole="alert" style={styles.errorText}>
                    {submitError}
                </ThemedText>
            ) : null}

            <View style={styles.actions}>
                <Button
                    title="Finalizar temporada"
                    variant="danger"
                    disabled={!matches}
                    loading={finish.isPending}
                    onPress={handleSubmit}
                />
                <Button
                    title="Cancelar"
                    variant="neutral"
                    disabled={finish.isPending}
                    onPress={() => router.back()}
                />
            </View>
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
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.xl,
        gap: spacing.md,
    },
    iconBubble: {
        alignSelf: 'center',
        width: 64,
        height: 64,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.dangerSoft,
        marginBottom: spacing.xs,
    },
    centered: {
        textAlign: 'center',
    },
    description: {
        color: colors.textSecondary,
    },
    actions: {
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    errorText: {
        color: colors.danger,
        textAlign: 'center',
    },
});
