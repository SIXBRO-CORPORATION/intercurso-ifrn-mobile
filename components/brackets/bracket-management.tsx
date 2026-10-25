import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { Button } from '@/components/button';
import { Toggle } from '@/components/form/toggle';
import { Icon, type IconName } from '@/components/icon';
import { ListRow } from '@/components/list-row';
import { InfoRow, Section } from '@/components/management/section';
import { ConfirmDialog } from '@/components/overlays/confirm-dialog';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { TeamAvatar } from '@/components/teams/team-avatar';
import {
    useBracketDetails,
    useBracketPreview,
    useBracketsBySeason,
    useCreateBracket,
    useResortBracket,
} from '@/hooks/useBrackets';
import { useAllModalities } from '@/hooks/useModalities';
import { useSeasonDetails } from '@/hooks/useSeasons';
import { useTeams } from '@/hooks/useTeams';
import { useToast } from '@/providers/ToastProvider';
import type { BracketMatchResponse, BracketSummaryResponse } from '@/types/bracket';
import {
    BracketStatusLabel,
    ModalityFormatLabel,
    type BracketStatus,
    type MatchStatus,
    type ModalityFormat,
    type SeasonStatus,
} from '@/types/enums';
import { colors, fontFamily, radius, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { formatCampusDateTime } from '@/utils/campus-time';

const FORMATS: ModalityFormat[] = ['KNOCKOUT', 'GROUP_STAGE_KNOCKOUT', 'ROUND_ROBIN', 'TRIANGULAR'];

const CREATABLE_SEASON_STATUSES: SeasonStatus[] = ['REGISTRATION_CLOSED', 'IN_PROGRESS'];

const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
    SCHEDULED: 'Agendada',
    IN_PROGRESS: 'Em andamento',
    FINISHED: 'Finalizada',
};

const FORMAT_META: Record<ModalityFormat, { description: string; icon: IconName }> = {
    KNOCKOUT: { description: 'Eliminação direta', icon: 'bracket' },
    GROUP_STAGE_KNOCKOUT: { description: 'Fase de grupos e eliminatórias', icon: 'grid' },
    ROUND_ROBIN: { description: 'Pontos corridos', icon: 'users' },
    TRIANGULAR: { description: '3 times jogam entre si', icon: 'chart' },
};

function matchTitle(match: BracketMatchResponse): string {
    const home = match.team1_name ?? 'A definir';
    const away = match.team2_name ?? 'A definir';
    return `${home} x ${away}`;
}

function regularRoundLabel(matches: BracketMatchResponse[], hasLaterRounds: boolean): string {
    const explicitLabel = matches.find((match) => !!match.round_name)?.round_name;
    if (explicitLabel) return explicitLabel;

    if (!hasLaterRounds) return 'Mata-mata';
    const matchCount = matches.length;
    if (matchCount <= 2) return 'Semifinal';
    if (matchCount <= 4) return 'Quartas de final';
    if (matchCount <= 8) return 'Oitavas de final';
    return 'Primeira fase';
}

interface MatchSection {
    key: string;
    label: string;
    matches: BracketMatchResponse[];
}

function groupMatchesIntoSections(matches: BracketMatchResponse[]): MatchSection[] {
    const sections: MatchSection[] = [];

    const byGroup = new Map<string, BracketMatchResponse[]>();
    matches
        .filter((match) => match.match_category === 'GROUP')
        .forEach((match) => {
            const label = match.group_name ?? 'Fase de grupos';
            byGroup.set(label, [...(byGroup.get(label) ?? []), match]);
        });
    byGroup.forEach((list, label) => sections.push({ key: `group-${label}`, label, matches: list }));

    const knockoutMatches = matches.filter((match) => match.match_category === 'KNOCKOUT');
    const regular = knockoutMatches.filter((match) => match.match_type === 'REGULAR');
    const semifinal = knockoutMatches.filter((match) => match.match_type === 'SEMIFINAL');
    const thirdPlaceMatches = knockoutMatches.filter((match) => match.match_type === 'THIRD_PLACE');
    const final = knockoutMatches.filter((match) => match.match_type === 'FINAL');

    if (regular.length > 0) {
        sections.push({
            key: 'regular',
            label: regularRoundLabel(regular, semifinal.length > 0 || final.length > 0),
            matches: regular,
        });
    }
    if (semifinal.length > 0) sections.push({ key: 'semifinal', label: 'Semifinal', matches: semifinal });
    if (thirdPlaceMatches.length > 0) {
        sections.push({ key: 'third-place', label: 'Disputa de terceiro lugar', matches: thirdPlaceMatches });
    }
    if (final.length > 0) sections.push({ key: 'final', label: 'Final', matches: final });

    return sections;
}

const BRACKET_STATUS_TONE: Record<BracketStatus, { background: string; foreground: string }> = {
    DRAFT: { background: colors.field, foreground: colors.textSecondary },
    ACTIVE: { background: colors.primarySoft, foreground: colors.primaryDark },
    FINISHED: { background: colors.field, foreground: colors.ink },
};

function BracketStatusCard({ bracket, modalityName }: { bracket: BracketSummaryResponse; modalityName: string }) {
    const tone = BRACKET_STATUS_TONE[bracket.status];

    return (
        <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
                <ThemedText variant="title" numberOfLines={1} style={styles.statusModality}>
                    {modalityName}
                </ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: tone.background }]}>
                    <ThemedText variant="caption" style={[styles.statusBadgeText, { color: tone.foreground }]}>
                        {BracketStatusLabel[bracket.status]}
                    </ThemedText>
                </View>
            </View>
            <ThemedText variant="body" style={styles.statusFormat}>
                {ModalityFormatLabel[bracket.format]}
            </ThemedText>
            <View style={styles.statusStats}>
                <View style={styles.statusStat}>
                    <ThemedText variant="title">{bracket.total_matches}</ThemedText>
                    <ThemedText variant="caption">Partidas</ThemedText>
                </View>
                <View style={styles.statusStat}>
                    <ThemedText variant="title">{bracket.started_matches}</ThemedText>
                    <ThemedText variant="caption">Iniciadas</ThemedText>
                </View>
                <View style={styles.statusStat}>
                    <ThemedText variant="title">{bracket.finished_matches}</ThemedText>
                    <ThemedText variant="caption">Finalizadas</ThemedText>
                </View>
            </View>
        </View>
    );
}

function StepProgress({ step }: { step: 1 | 2 }) {
    return (
        <View style={styles.stepWrapper}>
            <View style={styles.stepBars}>
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={[styles.stepBar, step === 2 ? styles.stepBarActive : styles.stepBarInactive]} />
            </View>
            <ThemedText variant="caption">{`Passo ${step} de 2`}</ThemedText>
        </View>
    );
}

function FormatCard({ format, selected, onSelect }: { format: ModalityFormat; selected: boolean; onSelect: () => void }) {
    const meta = FORMAT_META[format];
    return (
        <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${ModalityFormatLabel[format]}, ${meta.description}`}
            onPress={onSelect}
            style={({ pressed }) => [
                styles.formatCard,
                selected && styles.formatCardSelected,
                { opacity: pressed ? 0.85 : 1 },
            ]}
        >
            <View style={[styles.formatIcon, selected && styles.formatIconSelected]}>
                <Icon name={meta.icon} size={22} color={selected ? colors.surface : colors.ink} />
            </View>
            <View style={styles.formatTexts}>
                <ThemedText variant="section">{ModalityFormatLabel[format]}</ThemedText>
                <ThemedText variant="caption">{meta.description}</ThemedText>
            </View>
            {selected ? (
                <View style={styles.formatCheck}>
                    <Icon name="check" size={14} color={colors.surface} />
                </View>
            ) : (
                <View style={styles.formatRadio} />
            )}
        </Pressable>
    );
}

function ChooseFormatStep({
    modalityName,
    format,
    onChangeFormat,
    teamCount,
    thirdPlace,
    onChangeThirdPlace,
    previewPending,
    previewError,
    canContinue,
    onContinue,
}: {
    modalityName: string;
    format: ModalityFormat;
    onChangeFormat: (format: ModalityFormat) => void;
    teamCount: number | null;
    thirdPlace: boolean;
    onChangeThirdPlace: (value: boolean) => void;
    previewPending: boolean;
    previewError: unknown;
    canContinue: boolean;
    onContinue: () => void;
}) {
    return (
        <>
            <View style={styles.field}>
                <ThemedText variant="label">Modalidade</ThemedText>
                <View style={styles.fieldBox}>
                    <ThemedText variant="bodyLg">{modalityName}</ThemedText>
                    <Icon name="chev_d" size={18} color={colors.textMuted} />
                </View>
                {teamCount !== null ? (
                    <ThemedText variant="caption">
                        {teamCount} {teamCount === 1 ? 'time aprovado' : 'times aprovados'}
                    </ThemedText>
                ) : null}
            </View>

            <View style={styles.field}>
                <ThemedText variant="label">Formato da competição</ThemedText>
                <View style={styles.formatList}>
                    {FORMATS.map((item) => (
                        <FormatCard key={item} format={item} selected={format === item} onSelect={() => onChangeFormat(item)} />
                    ))}
                </View>
            </View>

            <ListRow
                title="Disputa de terceiro lugar"
                emphasis="regular"
                trailing={
                    <Toggle value={thirdPlace} onValueChange={onChangeThirdPlace} accessibilityLabel="Disputa de terceiro lugar" />
                }
            />

            {previewError ? (
                <ThemedText variant="bodySm" accessibilityRole="alert" style={styles.previewError}>
                    {friendlyErrorMessage(previewError, 'Não foi possível calcular a prévia.')}
                </ThemedText>
            ) : null}

            <Button title="Continuar" disabled={!canContinue} loading={previewPending} onPress={onContinue} />
        </>
    );
}

function matchesBreakdownLabel(matchesByRound: number[]): string {
    return matchesByRound.length > 1 ? ` (${matchesByRound.join('+')})` : '';
}

function ReviewAndDrawStep({
    seasonId,
    modalityId,
    modalityName,
    format,
    teamCount,
    byesEstimated,
    totalMatchesEstimated,
    matchesByRound,
    thirdPlace,
    creating,
    onConfirm,
    onBack,
}: {
    seasonId: string;
    modalityId: string;
    modalityName: string;
    format: ModalityFormat;
    teamCount: number;
    byesEstimated: number;
    totalMatchesEstimated: number;
    matchesByRound: number[];
    thirdPlace: boolean;
    creating: boolean;
    onConfirm: () => void;
    onBack: () => void;
}) {
    const approvedTeams = useTeams({ status: 'APPROVED', season_id: seasonId, modality_id: modalityId });
    const teams = approvedTeams.data ?? [];

    return (
        <>
            <ThemedText variant="title">Revise e sorteie</ThemedText>

            <Section title="Resumo">
                <InfoRow label="Modalidade" value={modalityName} />
                <InfoRow label="Formato" value={ModalityFormatLabel[format]} />
                <InfoRow
                    label="Partidas geradas"
                    value={`${totalMatchesEstimated}${matchesBreakdownLabel(matchesByRound)}`}
                />
                <InfoRow label="Times aprovados" value={String(teamCount)} />
                <InfoRow label="Byes estimados" value={String(byesEstimated)} />
                <InfoRow label="Terceiro lugar" value={thirdPlace ? 'Sim' : 'Não'} />
            </Section>

            {teams.length > 0 ? (
                <View style={styles.field}>
                    <ThemedText variant="label">{`Times participantes (${teams.length})`}</ThemedText>
                    <View style={styles.teamChipList}>
                        {teams.map((team) => (
                            <View key={team.team_id} style={styles.teamChip}>
                                <TeamAvatar name={team.name} photo={team.photo} size={24} />
                                <ThemedText variant="bodySm" numberOfLines={1}>
                                    {team.name}
                                </ThemedText>
                            </View>
                        ))}
                    </View>
                </View>
            ) : null}

            <View style={styles.banner}>
                <Icon name="info" size={18} color={colors.warningText} />
                <ThemedText variant="bodySm" style={styles.bannerWarningText}>
                    Se o número de times for ímpar, o sistema cria um bye e a partida é vencida por W.O.
                </ThemedText>
            </View>

            <View style={[styles.banner, styles.bannerSoft]}>
                <Icon name="bell" size={18} color={colors.primaryDark} />
                <ThemedText variant="bodySm" style={styles.bannerSoftText}>
                    Os times serão notificados do chaveamento e a temporada passa para em andamento.
                </ThemedText>
            </View>

            <Button title="Sortear times" icon="shuffle" loading={creating} onPress={onConfirm} />
            <Button title="Voltar" variant="neutral" disabled={creating} onPress={onBack} />
        </>
    );
}

export interface BracketManagementProps {
    seasonId: string;
    modalityId: string;
    onTitleChange?: (title: string) => void;
    onViewTree: () => void;
    onUnavailableBack?: () => void;
    scrollable?: boolean;
}

export function BracketManagement({
    seasonId,
    modalityId,
    onTitleChange,
    onViewTree,
    onUnavailableBack,
    scrollable = true,
}: BracketManagementProps) {
    const toast = useToast();
    const season = useSeasonDetails(seasonId);
    const brackets = useBracketsBySeason(seasonId);
    const modalities = useAllModalities();
    const createBracket = useCreateBracket();
    const resortBracket = useResortBracket();
    const [format, setFormat] = useState<ModalityFormat>('KNOCKOUT');
    const [thirdPlace, setThirdPlace] = useState(true);
    const [step, setStep] = useState<1 | 2>(1);
    const [resortOpen, setResortOpen] = useState(false);

    const bracket = brackets.data?.find((item) => item.modality_id === modalityId);
    const canCreate = season.data ? CREATABLE_SEASON_STATUSES.includes(season.data.status) : false;

    const preview = useBracketPreview(canCreate && !bracket ? { modality_id: modalityId, format } : null);
    const details = useBracketDetails(bracket?.bracket_id ?? '');

    const modalityName =
        bracket?.modality_name ?? modalities.data?.find((item) => item.modality_id === modalityId)?.name ?? 'Modalidade';

    useEffect(() => {
        onTitleChange?.(bracket ? modalityName : 'Novo chaveamento');
    }, [bracket, modalityName, onTitleChange]);

    if (season.isPending || brackets.isPending) {
        return <LoadingState label="Carregando chaveamento…" />;
    }

    if (season.isError || brackets.isError) {
        const error = season.error ?? brackets.error;
        return (
            <ErrorState
                title="Não foi possível carregar o chaveamento"
                description={friendlyErrorMessage(error, 'Tente de novo.')}
                onRetry={() => {
                    season.refetch();
                    brackets.refetch();
                }}
                retrying={season.isRefetching || brackets.isRefetching}
            />
        );
    }

    const seasonStatus = season.data.status;

    if (!bracket && !canCreate) {
        return (
            <EmptyState
                title={seasonStatus === 'REGISTRATION_OPEN' ? 'Inscrições abertas' : 'Chaveamento indisponível'}
                description={
                    seasonStatus === 'REGISTRATION_OPEN'
                        ? 'Encerre as inscrições para criar o chaveamento.'
                        : 'A temporada não está em um estado que permita criar chaveamento.'
                }
                actionLabel={onUnavailableBack ? 'Voltar' : undefined}
                onAction={onUnavailableBack}
            />
        );
    }

    const handleCreate = async () => {
        try {
            const created = await createBracket.mutateAsync({
                modality_id: modalityId,
                format,
                configuration: { has_third_place: thirdPlace },
            });
            toast.success(
                created.season_transitioned_to_in_progress
                    ? 'Chaveamento criado. A temporada passou para em andamento.'
                    : 'Chaveamento criado.'
            );
        } catch (error) {
            toast.error(friendlyErrorMessage(error, 'Não foi possível criar o chaveamento.'));
        }
    };

    const handleResort = async () => {
        if (!bracket) return;
        try {
            await resortBracket.mutateAsync(bracket.bracket_id);
            setResortOpen(false);
            toast.success('Chaveamento sorteado novamente.');
        } catch (error) {
            toast.error(friendlyErrorMessage(error, 'Não foi possível sortear novamente.'));
        }
    };

    const refreshing = season.isRefetching || brackets.isRefetching || details.isRefetching;
    const refresh = () => {
        season.refetch();
        brackets.refetch();
        modalities.refetch();
        if (bracket) details.refetch();
    };

    if (!bracket) {
        const wizardBody = (
            <>
                <StepProgress step={step} />

                {step === 1 ? (
                    <ChooseFormatStep
                        modalityName={modalityName}
                        format={format}
                        onChangeFormat={setFormat}
                        teamCount={preview.data?.team_count ?? null}
                        thirdPlace={thirdPlace}
                        onChangeThirdPlace={setThirdPlace}
                        previewPending={preview.isPending}
                        previewError={preview.isError ? preview.error : null}
                        canContinue={!!preview.data}
                        onContinue={() => setStep(2)}
                    />
                ) : (
                    <ReviewAndDrawStep
                        seasonId={seasonId}
                        modalityId={modalityId}
                        modalityName={modalityName}
                        format={format}
                        teamCount={preview.data?.team_count ?? 0}
                        byesEstimated={preview.data?.byes_estimated ?? 0}
                        totalMatchesEstimated={preview.data?.total_matches_estimated ?? 0}
                        matchesByRound={preview.data?.matches_by_round ?? []}
                        thirdPlace={thirdPlace}
                        creating={createBracket.isPending}
                        onConfirm={handleCreate}
                        onBack={() => setStep(1)}
                    />
                )}
            </>
        );

        return scrollable ? (
            <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.wizardContent}>
                {wizardBody}
            </ScrollView>
        ) : (
            <View style={styles.wizardContent}>{wizardBody}</View>
        );
    }

    const managementBody = (
        <>
            <BracketStatusCard bracket={bracket} modalityName={modalityName} />

            <View style={styles.actionsRow}>
                {bracket.available_actions.includes('resort') ? (
                    <Button
                        title="Re-sortear"
                        variant="warning"
                        size="compact"
                        icon="shuffle"
                        style={styles.actionButton}
                        onPress={() => setResortOpen(true)}
                    />
                ) : null}
                <Button
                    title="Ver árvore"
                    variant="soft"
                    size="compact"
                    icon="bracket"
                    style={styles.actionButton}
                    onPress={onViewTree}
                />
            </View>

            {details.isPending ? (
                <ThemedText variant="body">Carregando partidas…</ThemedText>
            ) : details.isError ? (
                <ThemedText variant="body" accessibilityRole="alert">
                    {friendlyErrorMessage(details.error, 'Não foi possível carregar as partidas.')}
                </ThemedText>
            ) : details.data && details.data.matches.length > 0 ? (
                groupMatchesIntoSections(details.data.matches).map((section) => (
                    <View key={section.key} style={styles.matchSection}>
                        <ThemedText variant="section">{section.label}</ThemedText>
                        {section.matches.map((match) => (
                            <MatchRow key={match.match_id} seasonId={seasonId} match={match} />
                        ))}
                    </View>
                ))
            ) : (
                <ThemedText variant="body">Nenhuma partida gerada.</ThemedText>
            )}
        </>
    );

    return (
        <>
            {scrollable ? (
                <ScrollView
                    contentInsetAdjustmentBehavior="automatic"
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
                >
                    {managementBody}
                </ScrollView>
            ) : (
                <View style={styles.content}>{managementBody}</View>
            )}

            <ConfirmDialog
                visible={resortOpen}
                title="Re-sortear chaveamento?"
                description={`${bracket.total_matches} partidas atuais serão apagadas, incluindo as datas já agendadas. Os times serão sorteados novamente.`}
                confirmLabel="Re-sortear"
                tone="danger"
                confirming={resortBracket.isPending}
                onConfirm={handleResort}
                onCancel={() => setResortOpen(false)}
            />
        </>
    );
}

function MatchRow({ seasonId, match }: { seasonId: string; match: BracketMatchResponse }) {
    const needsSchedule = match.status === 'SCHEDULED' && !match.scheduled_date;
    const href =
        match.status === 'SCHEDULED'
            ? `/seasons/${seasonId}/bracket/match/${match.match_id}?view=edit`
            : `/seasons/${seasonId}/bracket/match/${match.match_id}`;

    return (
        <Link href={href} asChild>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${matchTitle(match)}, ${MATCH_STATUS_LABEL[match.status]}. Gerenciar partida`}
            >
                {({ pressed }) => (
                    <View style={[styles.match, { opacity: pressed ? 0.7 : 1 }]}>
                        <View style={styles.matchTexts}>
                            <ThemedText variant="section" numberOfLines={1}>
                                {matchTitle(match)}
                            </ThemedText>

                            {match.status === 'IN_PROGRESS' ? (
                                <View style={styles.liveBadge}>
                                    <View style={styles.liveDot} />
                                    <ThemedText variant="overline" style={styles.matchLive}>
                                        AO VIVO
                                    </ThemedText>
                                </View>
                            ) : match.status === 'FINISHED' ? (
                                <ThemedText variant="caption" style={styles.matchMuted}>
                                    Finalizada
                                </ThemedText>
                            ) : (
                                <View style={styles.scheduleRow}>
                                    <Icon name="calendar" size={14} color={colors.textSecondary} />
                                    <ThemedText variant="caption" style={styles.matchMuted}>
                                        {match.scheduled_date ? formatCampusDateTime(match.scheduled_date) : 'Sem data'}
                                    </ThemedText>
                                </View>
                            )}
                        </View>

                        {needsSchedule ? (
                            <View style={styles.scheduleBadge}>
                                <ThemedText variant="caption" style={styles.scheduleBadgeText}>
                                    Agendar
                                </ThemedText>
                            </View>
                        ) : (
                            <Icon name="edit" size={18} color={colors.textMuted} />
                        )}
                    </View>
                )}
            </Pressable>
        </Link>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.md,
    },
    wizardContent: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.lg,
    },
    stepWrapper: {
        gap: spacing.xs,
    },
    stepBars: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    stepBar: {
        flex: 1,
        height: 4,
        borderRadius: radius.pill,
    },
    stepBarActive: {
        backgroundColor: colors.primary,
    },
    stepBarInactive: {
        backgroundColor: colors.border,
    },
    field: {
        gap: spacing.xs,
    },
    fieldBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 52,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    formatList: {
        gap: spacing.sm,
    },
    formatCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        borderWidth: 2,
        borderColor: 'transparent',
        backgroundColor: colors.field,
    },
    formatCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primarySoft,
    },
    formatIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
    },
    formatIconSelected: {
        backgroundColor: colors.primary,
    },
    formatTexts: {
        flex: 1,
        gap: 2,
    },
    formatCheck: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
    },
    formatRadio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: colors.border,
    },
    previewError: {
        color: colors.danger,
    },
    teamChipList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    teamChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        paddingVertical: spacing.xxs,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.pill,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
        maxWidth: 180,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.warningSoft,
    },
    bannerWarningText: {
        flex: 1,
        color: colors.warningText,
    },
    bannerSoft: {
        backgroundColor: colors.primarySoft,
    },
    bannerSoftText: {
        flex: 1,
        color: colors.primaryDark,
    },
    statusCard: {
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.xs,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    statusModality: {
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        borderCurve: 'continuous',
    },
    statusBadgeText: {
        fontFamily: fontFamily.bold,
    },
    statusFormat: {
        color: colors.textSecondary,
    },
    statusStats: {
        flexDirection: 'row',
        marginTop: spacing.sm,
    },
    statusStat: {
        flex: 1,
        gap: 2,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionButton: {
        flex: 1,
    },
    matchSection: {
        gap: spacing.sm,
    },
    match: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    matchTexts: {
        flex: 1,
        gap: 2,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        alignSelf: 'flex-start',
        paddingVertical: spacing.xxs,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.pill,
        borderCurve: 'continuous',
        backgroundColor: colors.dangerSoft,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.danger,
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
    },
    scheduleBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        borderCurve: 'continuous',
        backgroundColor: colors.primarySoft,
    },
    scheduleBadgeText: {
        color: colors.primaryDark,
        fontFamily: fontFamily.bold,
    },
    matchLive: {
        color: colors.danger,
    },
    matchMuted: {
        color: colors.textSecondary,
    },
});
