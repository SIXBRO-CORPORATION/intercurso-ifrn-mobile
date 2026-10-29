import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, type ListRenderItemInfo, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Button } from '@/components/button';
import { FilterChips, type FilterChipOption } from '@/components/filter-chips';
import { Icon } from '@/components/icon';
import { ManagementGuard } from '@/components/management/management-guard';
import { BottomSheet, type BottomSheetHandle } from '@/components/overlays/bottom-sheet';
import { Segmented } from '@/components/form/segmented';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { TeamAvatar } from '@/components/teams/team-avatar';
import { ThemedText } from '@/components/themed-text';
import { useAllModalities } from '@/hooks/useModalities';
import { useMatchList } from '@/hooks/useMatches';
import { useActiveSeason } from '@/hooks/useSeasons';
import { ApiError } from '@/types/api';
import { MatchCategoryLabel, MatchTypeLabel, type MatchStatus } from '@/types/enums';
import type { MatchListItemResponse } from '@/types/match-list';
import { colors, fontFamily, radius, shadows, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { formatCampusShortDate, formatCampusTime, getCampusDayRange } from '@/utils/campus-time';

const NO_ACTIVE_SEASON_STATUS = 400;
const ALL_MODALITIES = 'all';

const STATUS_OPTIONS: { value: MatchStatus; label: string }[] = [
    { value: 'SCHEDULED', label: 'Agendadas' },
    { value: 'IN_PROGRESS', label: 'Em andamento' },
    { value: 'FINISHED', label: 'Encerradas' },
];

const EMPTY_LABEL: Record<MatchStatus, string> = {
    SCHEDULED: 'Nenhuma partida agendada',
    IN_PROGRESS: 'Nenhuma partida em andamento',
    FINISHED: 'Nenhuma partida encerrada',
};

function matchSubtitle(match: MatchListItemResponse): string {
    const round =
        match.match_type !== 'REGULAR'
            ? MatchTypeLabel[match.match_type]
            : (match.group_name ?? MatchCategoryLabel[match.match_category]);
    return `${match.modality_name ?? 'Partida'} · ${round}`;
}

function matchDateLabel(match: MatchListItemResponse): string {
    if (!match.scheduled_date) return 'Sem data';

    const { dateFrom, dateTo } = getCampusDayRange('today');
    const scheduledAt = Date.parse(match.scheduled_date);
    const isToday = scheduledAt >= Date.parse(dateFrom) && scheduledAt <= Date.parse(dateTo);
    const day = isToday ? 'Hoje' : formatCampusShortDate(match.scheduled_date);

    return `${day} · ${formatCampusTime(match.scheduled_date)}`;
}

function MatchSeparator() {
    return <View style={styles.separator} />;
}

const MatchRow = memo(function MatchRow({ seasonId, match }: { seasonId: string; match: MatchListItemResponse }) {
    const isScheduled = match.status === 'SCHEDULED';
    const isLive = match.status === 'IN_PROGRESS';
    const team1Name = match.team1?.name ?? 'A definir';
    const team2Name = match.team2?.name ?? 'A definir';
    const readyToStart = isScheduled && !!match.team1 && !!match.team2 && !!match.scheduled_date;

    const editHref = `/(management-matches)/matches/${match.match_id}?seasonId=${seasonId}&view=edit` as const;
    const liveHref = `/(management-matches)/matches/${match.match_id}?seasonId=${seasonId}` as const;

    return (
        <Link href={isScheduled ? editHref : liveHref} asChild>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${team1Name} contra ${team2Name}, ${matchSubtitle(match)}`}
            >
                {({ pressed }) => (
                    <View style={[styles.card, { opacity: pressed ? 0.85 : 1 }]}>
                        <View style={styles.cardHeader}>
                            <ThemedText variant="caption" numberOfLines={1} style={styles.cardHeaderMuted}>
                                {matchSubtitle(match)}
                            </ThemedText>
                            {isLive ? (
                                <View style={styles.liveRow}>
                                    <View style={styles.liveDot} />
                                    <ThemedText variant="overline" style={styles.liveLabel}>
                                        AO VIVO
                                    </ThemedText>
                                </View>
                            ) : (
                                <ThemedText variant="label" style={styles.cardHeaderStrong}>
                                    {match.status === 'FINISHED' ? 'Encerrada' : matchDateLabel(match)}
                                </ThemedText>
                            )}
                        </View>

                        <View style={styles.cardRow}>
                            <View style={styles.cardTeam}>
                                <TeamAvatar name={team1Name} photo={match.team1?.photo} size={56} />
                                <ThemedText variant="section" numberOfLines={1} style={styles.cardTeamName}>
                                    {team1Name}
                                </ThemedText>
                            </View>

                            <View style={styles.cardCenter}>
                                {readyToStart ? (
                                    <Button
                                        title="Iniciar"
                                        size="small"
                                        icon="play"
                                        onPress={() => router.push(liveHref)}
                                    />
                                ) : isScheduled ? (
                                    <Button
                                        title="Agendar"
                                        size="small"
                                        variant="neutral"
                                        icon="edit"
                                        onPress={() => router.push(editHref)}
                                    />
                                ) : (
                                    <ThemedText variant="timer" style={styles.cardScore}>
                                        {match.team1?.score ?? 0} × {match.team2?.score ?? 0}
                                    </ThemedText>
                                )}
                            </View>

                            <View style={styles.cardTeam}>
                                <TeamAvatar name={team2Name} photo={match.team2?.photo} size={56} />
                                <ThemedText variant="section" numberOfLines={1} style={styles.cardTeamName}>
                                    {team2Name}
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                )}
            </Pressable>
        </Link>
    );
});

function MonitorMatchesContent({ seasonId }: { seasonId: string }) {
    const modalities = useAllModalities();
    const filterSheet = useRef<BottomSheetHandle>(null);

    const [status, setStatus] = useState<MatchStatus>('SCHEDULED');
    const [modalityId, setModalityId] = useState<string>(ALL_MODALITIES);

    const list = useMatchList(
        { seasonId, status, modalityId: modalityId === ALL_MODALITIES ? undefined : modalityId },
        !!seasonId
    );

    const matches: MatchListItemResponse[] = list.data?.pages.flatMap((page) => page.items) ?? [];

    const modalityOptions: FilterChipOption<string>[] = useMemo(
        () => [
            { value: ALL_MODALITIES, label: 'Todas as modalidades' },
            ...(modalities.data ?? []).map((modality) => ({ value: modality.modality_id, label: modality.name })),
        ],
        [modalities.data]
    );

    const activeModalityName =
        modalityId === ALL_MODALITIES
            ? null
            : (modalities.data ?? []).find((modality) => modality.modality_id === modalityId)?.name;

    const header = (
        <View style={styles.header}>
            <View style={styles.headerRow}>
                <View style={styles.titleBlock}>
                    <ThemedText variant="largeTitle">Partidas</ThemedText>
                    <ThemedText variant="body" style={styles.titleSubtitle}>
                        Gerenciamento
                    </ThemedText>
                </View>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Filtrar partidas por modalidade"
                    onPress={() => filterSheet.current?.present()}
                    style={({ pressed }) => [styles.filterButton, { opacity: pressed ? 0.7 : 1 }]}
                >
                    <Icon name="filter" size={20} color={colors.ink} />
                </Pressable>
            </View>

            <Segmented options={STATUS_OPTIONS} value={status} onChange={setStatus} />

            {activeModalityName ? (
                <ThemedText variant="bodySm" style={styles.activeFilterLine}>
                    Modalidade: {activeModalityName}
                </ThemedText>
            ) : null}
        </View>
    );

    const renderEmpty = () => {
        if (list.isPending) {
            return <LoadingState label="Carregando partidas…" />;
        }

        if (list.isError) {
            return (
                <ErrorState
                    title="Não foi possível carregar as partidas"
                    description={friendlyErrorMessage(list.error, 'Tente de novo.')}
                    onRetry={() => list.refetch()}
                    retrying={list.isRefetching}
                />
            );
        }

        return (
            <EmptyState
                title={EMPTY_LABEL[status]}
                description={activeModalityName ? `Em ${activeModalityName}. Troque o filtro para ver outras.` : undefined}
            />
        );
    };

    const renderItem = useCallback(
        ({ item }: ListRenderItemInfo<MatchListItemResponse>) => <MatchRow seasonId={seasonId} match={item} />,
        [seasonId]
    );

    return (
        <>
            <FlatList
                data={matches}
                keyExtractor={(item) => item.match_id}
                renderItem={renderItem}
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={[styles.content, matches.length === 0 && styles.fill]}
                ItemSeparatorComponent={MatchSeparator}
                ListHeaderComponent={header}
                ListEmptyComponent={renderEmpty()}
                refreshControl={
                    <RefreshControl
                        refreshing={list.isRefetching && !list.isFetchingNextPage}
                        onRefresh={() => list.refetch()}
                    />
                }
                onEndReachedThreshold={0.4}
                onEndReached={() => {
                    if (list.hasNextPage && !list.isFetchingNextPage) {
                        list.fetchNextPage();
                    }
                }}
                ListFooterComponent={list.isFetchingNextPage ? <LoadingState label="Carregando mais partidas…" /> : null}
            />

            <BottomSheet ref={filterSheet} title="Filtrar por modalidade" snapPoints={['50%']}>
                <FilterChips
                    accessibilityLabel="Filtrar por modalidade"
                    options={modalityOptions}
                    selected={modalityId}
                    onSelect={(value) => {
                        setModalityId(value);
                        filterSheet.current?.dismiss();
                    }}
                />
            </BottomSheet>
        </>
    );
}

function MonitorMatchesGate() {
    const activeSeason = useActiveSeason();

    if (activeSeason.isPending) {
        return <LoadingState label="Carregando…" />;
    }

    if (activeSeason.isError) {
        if (activeSeason.error instanceof ApiError && activeSeason.error.status === NO_ACTIVE_SEASON_STATUS) {
            return (
                <EmptyState
                    title="Nenhuma temporada ativa"
                    description="Crie ou abra uma temporada para gerenciar as partidas."
                />
            );
        }

        return (
            <ErrorState
                title="Não foi possível carregar a temporada"
                description={friendlyErrorMessage(activeSeason.error, 'Tente de novo.')}
                onRetry={() => activeSeason.refetch()}
                retrying={activeSeason.isRefetching}
            />
        );
    }

    return <MonitorMatchesContent seasonId={activeSeason.data.season_id} />;
}

export default function MonitorMatchesScreen() {
    return (
        <ManagementGuard>
            <MonitorMatchesGate />
        </ManagementGuard>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
    },
    fill: {
        flexGrow: 1,
    },
    header: {
        gap: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    titleBlock: {
        gap: 2,
    },
    titleSubtitle: {
        color: colors.textSecondary,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.field,
    },
    activeFilterLine: {
        color: colors.textSecondary,
    },
    separator: {
        height: spacing.sm,
    },
    card: {
        gap: spacing.sm,
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.surface,
        boxShadow: shadows.card,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    cardHeaderMuted: {
        flex: 1,
        color: colors.textSecondary,
    },
    cardHeaderStrong: {
        fontFamily: fontFamily.bold,
        color: colors.ink,
    },
    liveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.danger,
    },
    liveLabel: {
        color: colors.danger,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTeam: {
        flex: 1,
        alignItems: 'center',
        gap: spacing.xs,
    },
    cardTeamName: {
        textAlign: 'center',
    },
    cardCenter: {
        minWidth: 112,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardScore: {
        color: colors.ink,
    },
});
