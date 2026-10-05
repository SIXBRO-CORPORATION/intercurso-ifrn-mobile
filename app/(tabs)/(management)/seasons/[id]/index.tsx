import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/button';
import { InfoRow, Section } from '@/components/management/section';
import { ManagementGuard } from '@/components/management/management-guard';
import { SeasonStatusBadge } from '@/components/management/season-status-badge';
import { ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useBracketsBySeason } from '@/hooks/useBrackets';
import { useAllModalities } from '@/hooks/useModalities';
import { useCloseSeasonRegistration, useSeasonDetails } from '@/hooks/useSeasons';
import { ApiError } from '@/types/api';
import { BracketStatusLabel, type SeasonStatus } from '@/types/enums';
import type { BracketSummaryResponse } from '@/types/bracket';
import type { SeasonDetails } from '@/types/season';
import { spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { formatCampusDateTime } from '@/utils/campus-time';

const NEXT_STEP: Record<SeasonStatus, string> = {
    DRAFT: 'As inscrições abrem na data de início, se não houver outra temporada ativa; senão a abertura é adiada até ela ser finalizada. Você pode ajustar as datas antes disso.',
    REGISTRATION_OPEN: 'Equipes podem ser criadas e submetidas. Aprove as equipes e confirme as doações.',
    REGISTRATION_CLOSED: 'Inscrições encerradas. Crie o chaveamento das modalidades para iniciar a temporada.',
    IN_PROGRESS: 'Temporada em andamento. Finalize quando todas as partidas estiverem encerradas.',
    FINISHED: 'Temporada finalizada. Nenhuma alteração é permitida.',
};

function dateOrDash(iso?: string | null): string {
    return iso ? formatCampusDateTime(iso) : '—';
}

function bracketLabel(bracket?: BracketSummaryResponse): string {
    if (!bracket) return 'Chaveamento não criado';
    return `${BracketStatusLabel[bracket.status]} · ${bracket.finished_matches}/${bracket.total_matches} partidas`;
}

function RegistrationActions({ season }: { season: SeasonDetails }) {
    const closeRegistration = useCloseSeasonRegistration();
    const has = (action: SeasonDetails['available_actions'][number]) => season.available_actions.includes(action);
    const base = `/seasons/${season.season_id}`;

    const confirmClose = () =>
        Alert.alert(
            'Encerrar inscrições agora?',
            'Nenhum novo time poderá ser criado ou submetido. Você pode reabrir as inscrições depois.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Encerrar',
                    style: 'destructive',
                    onPress: () => closeRegistration.mutate({ seasonId: season.season_id }),
                },
            ]
        );

    if (season.available_actions.length === 0) {
        return (
            <ThemedText variant="caption">
                {season.status === 'FINISHED'
                    ? 'Temporada finalizada: datas e inscrições não podem ser alteradas.'
                    : 'Temporada em andamento: datas de inscrição não podem ser alteradas.'}
            </ThemedText>
        );
    }

    return (
        <View style={styles.actions}>
            {has('edit_registration_dates') ? (
                <Button
                    title="Editar datas de inscrição"
                    variant="secondary"
                    onPress={() => router.push({ pathname: `${base}/edit-dates` as never, params: { mode: 'both' } })}
                />
            ) : null}
            {has('edit_registration_end_date') ? (
                <Button
                    title="Editar data de encerramento"
                    variant="secondary"
                    onPress={() => router.push({ pathname: `${base}/edit-dates` as never, params: { mode: 'end' } })}
                />
            ) : null}
            {has('close_registration_early') ? (
                <Button
                    title="Encerrar inscrições agora"
                    variant="destructive"
                    loading={closeRegistration.isPending}
                    onPress={confirmClose}
                />
            ) : null}
            {has('reopen_registration') ? (
                <Button title="Reabrir inscrições" onPress={() => router.push(`${base}/reopen` as never)} />
            ) : null}
            {closeRegistration.isError ? (
                <ThemedText variant="caption" accessibilityRole="alert">
                    {friendlyErrorMessage(closeRegistration.error, 'Não foi possível encerrar as inscrições.')}
                </ThemedText>
            ) : null}
        </View>
    );
}

function FinishSection({ season, brackets }: { season: SeasonDetails; brackets: BracketSummaryResponse[] | undefined }) {
    if (season.status !== 'IN_PROGRESS') return null;

    const pending = brackets
        ? brackets.reduce((sum, bracket) => sum + (bracket.total_matches - bracket.finished_matches), 0)
        : null;
    const blockedReason =
        pending === null
            ? 'Carregando partidas para verificar pendências…'
            : pending > 0
              ? `Ainda há ${pending} ${pending === 1 ? 'partida' : 'partidas'} sem encerrar.`
              : null;

    return (
        <Section title="Finalizar temporada">
            <ThemedText variant="subhead">
                Ação irreversível. Encerra a temporada e desativa todos os convites de equipes.
            </ThemedText>
            {blockedReason ? <ThemedText variant="caption">{blockedReason}</ThemedText> : null}
            <Button
                title="Finalizar temporada"
                variant="destructive"
                disabled={blockedReason !== null}
                onPress={() => router.push(`/seasons/${season.season_id}/finish` as never)}
            />
        </Section>
    );
}

function SeasonDetailsContent({ seasonId }: { seasonId: string }) {
    const details = useSeasonDetails(seasonId);
    const modalities = useAllModalities();
    const brackets = useBracketsBySeason(seasonId);

    if (details.isPending) {
        return <LoadingState label="Carregando temporada…" />;
    }

    if (details.isError) {
        const forbidden = details.error instanceof ApiError && details.error.status === 403;
        return (
            <ErrorState
                title={forbidden ? 'Sem permissão' : 'Não foi possível carregar a temporada'}
                description={
                    forbidden
                        ? 'Esta área é exclusiva para monitores e administradores.'
                        : friendlyErrorMessage(details.error, 'Tente de novo.')
                }
                onRetry={forbidden ? undefined : () => details.refetch()}
                retrying={details.isRefetching}
            />
        );
    }

    const season = details.data;
    const modalityNames = new Map<string, string>([
        ...(brackets.data ?? []).map((item) => [item.modality_id, item.modality_name ?? ''] as const),
        ...(modalities.data ?? []).map((item) => [item.modality_id, item.name] as const),
    ].filter(([, name]) => name));
    const bracketByModality = new Map((brackets.data ?? []).map((item) => [item.modality_id, item]));

    const refreshing = details.isRefetching || brackets.isRefetching;
    const refresh = () => {
        details.refetch();
        brackets.refetch();
    };

    return (
        <>
            <Stack.Screen options={{ title: season.name }} />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            >
                <View style={styles.hero}>
                    <ThemedText variant="title" selectable>
                        {season.name}
                    </ThemedText>
                    <ThemedText variant="subhead">
                        {season.year}
                        {season.active ? ' · Temporada ativa' : ''}
                    </ThemedText>
                    <SeasonStatusBadge status={season.status} />
                    <ThemedText variant="subhead">{NEXT_STEP[season.status]}</ThemedText>
                </View>

                <Section title="Inscrições">
                    <InfoRow label="Início previsto" value={dateOrDash(season.registration_start_date)} />
                    <InfoRow label="Fim previsto" value={dateOrDash(season.registration_end_date)} />
                    <InfoRow label="Aberta em" value={dateOrDash(season.registration_opened_at)} />
                    <InfoRow label="Encerrada em" value={dateOrDash(season.registration_closed_at)} />
                    <RegistrationActions season={season} />
                </Section>

                <Section title="Equipes">
                    <InfoRow label="Criadas" value={String(season.total_teams_created)} />
                    <InfoRow label="Submetidas (total)" value={String(season.total_teams_submitted)} />
                    <InfoRow label="Aprovadas" value={String(season.total_teams_approved)} />
                    <ThemedText variant="caption">
                        “Submetidas” inclui as já aprovadas e rejeitadas.
                    </ThemedText>
                </Section>

                <Section title="Modalidades e chaveamento">
                    {season.modality_ids.length === 0 ? (
                        <ThemedText variant="subhead">Nenhuma modalidade vinculada.</ThemedText>
                    ) : (
                        season.modality_ids.map((id) => (
                            <InfoRow
                                key={id}
                                label={modalityNames.get(id) ?? 'Modalidade'}
                                value={
                                    brackets.isPending
                                        ? 'Carregando…'
                                        : brackets.isError
                                          ? 'Indisponível'
                                          : bracketLabel(bracketByModality.get(id))
                                }
                            />
                        ))
                    )}
                    {brackets.isError ? (
                        <ThemedText variant="caption" accessibilityRole="alert">
                            Não foi possível carregar os chaveamentos. Puxe para atualizar.
                        </ThemedText>
                    ) : null}
                </Section>

                <FinishSection season={season} brackets={brackets.data} />
            </ScrollView>
        </>
    );
}

export default function SeasonDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <ManagementGuard>
            <SeasonDetailsContent seasonId={id} />
        </ManagementGuard>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.md,
    },
    hero: {
        gap: spacing.xs,
    },
    actions: {
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
});
