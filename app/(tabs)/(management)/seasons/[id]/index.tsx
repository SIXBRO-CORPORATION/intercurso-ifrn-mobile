import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/button';
import { LinkRow, Section } from '@/components/management/section';
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
import { colors, radius, spacing } from '@/theme';
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

function StatBox({ value, label, color }: { value: number; label: string; color: string }) {
    return (
        <View style={styles.statBox}>
            <ThemedText variant="largeTitle" style={{ color }}>
                {value}
            </ThemedText>
            <ThemedText variant="label" style={styles.statLabel}>
                {label}
            </ThemedText>
        </View>
    );
}

function DateRow({ label, planned, real, isLast }: { label: string; planned: string; real?: string | null; isLast?: boolean }) {
    return (
        <View style={[styles.dateRow, isLast && styles.dateRowLast]}>
            <View style={styles.dateRowTexts}>
                <ThemedText variant="caption">{label}</ThemedText>
                <ThemedText variant="section">{planned}</ThemedText>
            </View>
            <ThemedText variant="caption" style={styles.dateRowAnnotation}>
                {real ? `Real: ${formatCampusDateTime(real)}` : 'Previsto'}
            </ThemedText>
        </View>
    );
}

function RegistrationActions({ season }: { season: SeasonDetails }) {
    const closeRegistration = useCloseSeasonRegistration();
    const has = (action: SeasonDetails['available_actions'][number]) => season.available_actions.includes(action);
    const base = `/seasons/${season.season_id}`;
    const canEditDates = has('edit_registration_dates') || has('edit_registration_end_date');

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

    return (
        <View style={styles.actions}>
            {has('close_registration_early') ? (
                <Button
                    title="Encerrar inscrições agora"
                    variant="warning"
                    icon="clock"
                    loading={closeRegistration.isPending}
                    onPress={confirmClose}
                />
            ) : null}
            {has('reopen_registration') ? (
                <Button
                    title="Reabrir inscrições"
                    variant="primary"
                    icon="undo"
                    onPress={() => router.push(`${base}/reopen` as never)}
                />
            ) : null}
            <Button
                title="Editar datas"
                variant="neutral"
                icon={canEditDates ? 'edit' : 'lock'}
                disabled={!canEditDates}
                onPress={() => {
                    if (has('edit_registration_dates')) {
                        router.push({ pathname: `${base}/edit-dates` as never, params: { mode: 'both' } });
                    } else {
                        router.push({ pathname: `${base}/edit-dates` as never, params: { mode: 'end' } });
                    }
                }}
            />
            {!canEditDates ? (
                <ThemedText variant="caption" style={styles.actionsHint}>
                    A edição de datas só é possível antes da abertura.
                </ThemedText>
            ) : null}
            {closeRegistration.isError ? (
                <ThemedText variant="caption" accessibilityRole="alert" style={styles.errorText}>
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
            <ThemedText variant="body">
                Ação irreversível. Encerra a temporada e desativa todos os convites de equipes.
            </ThemedText>
            {blockedReason ? <ThemedText variant="caption">{blockedReason}</ThemedText> : null}
            <Button
                title="Finalizar temporada"
                variant="danger"
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
                <View style={styles.badgesRow}>
                    <SeasonStatusBadge status={season.status} />
                    {season.active ? (
                        <View style={styles.activeBadge}>
                            <ThemedText variant="label" style={styles.activeBadgeText}>
                                Ativa
                            </ThemedText>
                        </View>
                    ) : null}
                </View>
                <ThemedText variant="body" style={styles.nextStep}>
                    {NEXT_STEP[season.status]}
                </ThemedText>

                <View style={styles.statsRow}>
                    <StatBox value={season.total_teams_created} label="Times criados" color={colors.ink} />
                    <StatBox value={season.total_teams_submitted} label="Submetidos" color={colors.warningText} />
                    <StatBox value={season.total_teams_approved} label="Aprovados" color={colors.primary} />
                </View>

                <View style={styles.datesCard}>
                    <DateRow
                        label="Abertura"
                        planned={dateOrDash(season.registration_start_date)}
                        real={season.registration_opened_at}
                    />
                    <DateRow
                        label="Encerramento"
                        planned={dateOrDash(season.registration_end_date)}
                        real={season.registration_closed_at}
                        isLast
                    />
                </View>

                <RegistrationActions season={season} />

                <Section title={`Modalidades (${season.modality_ids.length})`}>
                    {season.modality_ids.length === 0 ? (
                        <ThemedText variant="body">Nenhuma modalidade vinculada.</ThemedText>
                    ) : (
                        season.modality_ids.map((id) => (
                            <LinkRow
                                key={id}
                                label={modalityNames.get(id) ?? 'Modalidade'}
                                value={
                                    brackets.isPending
                                        ? 'Carregando…'
                                        : brackets.isError
                                          ? 'Indisponível'
                                          : bracketLabel(bracketByModality.get(id))
                                }
                                onPress={() => router.push(`/seasons/${season.season_id}/bracket/${id}` as never)}
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
    badgesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    activeBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        backgroundColor: colors.warningSoft,
    },
    activeBadgeText: {
        color: colors.warningText,
    },
    nextStep: {
        color: colors.textSecondary,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    statLabel: {
        color: colors.textSecondary,
    },
    datesCard: {
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    dateRowLast: {
        borderBottomWidth: 0,
    },
    dateRowTexts: {
        gap: 2,
    },
    dateRowAnnotation: {
        color: colors.textMuted,
    },
    actions: {
        gap: spacing.sm,
    },
    actionsHint: {
        color: colors.textSecondary,
        textAlign: 'center',
    },
    errorText: {
        color: colors.danger,
    },
});
