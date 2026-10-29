import { useCallback, useMemo, useState } from 'react';
import {
    RefreshControl,
    SectionList,
    StyleSheet,
    View,
    type SectionListRenderItem,
} from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { FilterChips, type FilterChipOption } from '@/components/filter-chips';
import { Icon } from '@/components/icon';
import { MatchCard } from '@/components/match-card';
import { FinishedTrailing, LiveTrailing, MatchListRow, ScheduledTrailing } from '@/components/list-row';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useActiveSeason } from '@/hooks/useSeasons';
import { useModalities } from '@/hooks/useModalities';
import { useMatchList } from '@/hooks/useMatches';
import { useSeasonLive } from '@/hooks/useRealtime';
import { formatCampusDate, formatCampusTime, formatMatchClock, getCampusDayRange } from '@/utils/campus-time';
import { ApiError } from '@/types/api';
import { colors, spacing } from '@/theme';
import type { MatchListFilters, MatchListItemResponse } from '@/types/match-list';

const NO_ACTIVE_SEASON_STATUS = 400;
const EMPTY_MATCHES: MatchListItemResponse[] = [];

function errorMessage(error: unknown, fallback: string): string {
    return error instanceof ApiError ? error.message : fallback;
}

type GameSection = {
    key: string;
    kind: 'live' | 'day' | 'finished';
    title: string;
    trailing?: string;
    data: MatchListItemResponse[];
};

function pad(value: number): string {
    return String(value).padStart(2, '0');
}

function dayOrderKey(ddmmyyyy: string): number {
    const [day, month, year] = ddmmyyyy.split('/').map(Number);
    return year * 10000 + month * 100 + day;
}

function formatDayHeader(ddmmyyyy: string): string {
    const [day, month, year] = ddmmyyyy.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const monthShort = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalized}, ${pad(day)} ${monthShort}`;
}

function buildSections(matches: MatchListItemResponse[]): GameSection[] {
    const now = new Date();
    const todayStr = formatCampusDate(now.toISOString());
    const tomorrowStr = formatCampusDate(getCampusDayRange('tomorrow', now).dateFrom);

    const sections: GameSection[] = [];

    const live = matches.filter((match) => match.status === 'IN_PROGRESS');
    if (live.length > 0) {
        sections.push({
            key: 'live',
            kind: 'live',
            title: 'Ao vivo',
            trailing: `${live.length} jogo${live.length === 1 ? '' : 's'}`,
            data: live,
        });
    }

    const scheduled = matches.filter((match) => match.status === 'SCHEDULED' && match.scheduled_date);
    const buckets = new Map<string, { order: number; data: MatchListItemResponse[] }>();
    for (const match of scheduled) {
        const dateStr = formatCampusDate(match.scheduled_date as string);
        if (!buckets.has(dateStr)) {
            buckets.set(dateStr, { order: dayOrderKey(dateStr), data: [] });
        }
        buckets.get(dateStr)!.data.push(match);
    }

    Array.from(buckets.entries())
        .sort(([, a], [, b]) => a.order - b.order)
        .forEach(([dateStr, bucket]) => {
            const dateLabel = formatDayHeader(dateStr);
            const isToday = dateStr === todayStr;
            const isTomorrow = dateStr === tomorrowStr;

            sections.push({
                key: `day-${bucket.order}`,
                kind: 'day',
                title: isToday ? 'Hoje' : isTomorrow ? 'Amanhã' : dateLabel,
                trailing: isToday || isTomorrow ? dateLabel : undefined,
                data: bucket.data.sort((a, b) => (a.scheduled_date ?? '').localeCompare(b.scheduled_date ?? '')),
            });
        });

    const finished = matches
        .filter((match) => match.status === 'FINISHED')
        .sort((a, b) => (b.scheduled_date ?? '').localeCompare(a.scheduled_date ?? ''));
    if (finished.length > 0) {
        sections.push({ key: 'finished', kind: 'finished', title: 'Encerradas', data: finished });
    }

    return sections;
}

function MatchSeparator() {
    return <View style={styles.separator} />;
}

function SectionSeparator() {
    return <View style={styles.sectionSeparator} />;
}

function matchRowProps(match: MatchListItemResponse) {
    const showScore = match.status !== 'SCHEDULED';
    const team1 = { name: match.team1?.name ?? 'A definir', score: showScore ? match.team1?.score : undefined };
    const team2 = { name: match.team2?.name ?? 'A definir', score: showScore ? match.team2?.score : undefined };

    let trailing = null;
    if (match.status === 'IN_PROGRESS') {
        trailing = <LiveTrailing minute={formatMatchClock(match.clock_seconds)} />;
    } else if (match.status === 'FINISHED') {
        trailing = <FinishedTrailing />;
    } else {
        trailing = (
            <ScheduledTrailing
                time={match.scheduled_date ? formatCampusTime(match.scheduled_date) : 'Sem data'}
                modality={match.modality_name ?? undefined}
            />
        );
    }

    return { team1, team2, trailing };
}

export default function GamesScreen() {
    const [modalityFilter, setModalityFilter] = useState<string>('all');

    const season = useActiveSeason();
    const seasonId = season.data?.season_id;

    useSeasonLive(seasonId);

    const modalities = useModalities(seasonId);

    const listFilters = useMemo<MatchListFilters | undefined>(() => {
        if (!seasonId) return undefined;

        const filters: MatchListFilters = { seasonId };
        if (modalityFilter !== 'all') filters.modalityId = modalityFilter;

        return filters;
    }, [seasonId, modalityFilter]);

    const list = useMatchList(listFilters ?? { seasonId: '' }, !!listFilters);

    const matches = useMemo<MatchListItemResponse[]>(
        () => list.data?.pages.flatMap((page) => page.items) ?? EMPTY_MATCHES,
        [list.data]
    );
    const sections = useMemo(() => buildSections(matches), [matches]);
    const hasActiveFilters = modalityFilter !== 'all';

    const contentStyle = useMemo(
        () => [styles.content, sections.length === 0 && styles.contentFill],
        [sections.length]
    );

    const clearFilters = () => setModalityFilter('all');

    const modalityOptions: FilterChipOption<string>[] = [
        { value: 'all', label: 'Todas' },
        ...(modalities.data ?? []).map((m) => ({ value: m.modality_id, label: m.name })),
    ];

    const renderItem: SectionListRenderItem<MatchListItemResponse, GameSection> = useCallback(
        ({ item, index, section }) => {
            if (section.kind === 'live' && index === 0) {
                return <MatchCard match={item} dataUpdatedAt={list.dataUpdatedAt} />;
            }

            const { team1, team2, trailing } = matchRowProps(item);
            return (
                <MatchListRow
                    team1={team1}
                    team2={team2}
                    trailing={trailing}
                    onPress={() => router.push(`/match/${item.match_id}`)}
                />
            );
        },
        [list.dataUpdatedAt]
    );

    const renderSectionHeader = useCallback(
        ({ section }: { section: GameSection }) => (
            <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                    {section.kind === 'live' ? <View style={styles.liveDot} /> : null}
                    <ThemedText variant="heading">{section.title}</ThemedText>
                </View>
                {section.trailing ? (
                    <ThemedText variant="body" style={styles.sectionTrailing}>
                        {section.trailing}
                    </ThemedText>
                ) : null}
            </View>
        ),
        []
    );

    if (season.isPending) {
        return <LoadingState label="Carregando temporada…" />;
    }

    if (season.isError) {
        if (season.error instanceof ApiError && season.error.status === NO_ACTIVE_SEASON_STATUS) {
            return (
                <EmptyState
                    title="Nenhuma temporada ativa"
                    description="Quando uma temporada começar, as modalidades e os jogos aparecerão aqui."
                />
            );
        }

        return (
            <ErrorState
                title="Não foi possível carregar a temporada"
                description={errorMessage(season.error, 'Verifique sua conexão e tente de novo.')}
                onRetry={() => season.refetch()}
                retrying={season.isRefetching}
            />
        );
    }

    const renderListEmpty = () => {
        if (list.isPending) {
            return <LoadingState label="Carregando jogos…" />;
        }

        if (list.isError) {
            return (
                <ErrorState
                    title="Não foi possível carregar os jogos"
                    description={errorMessage(list.error, 'Verifique sua conexão e tente de novo.')}
                    onRetry={() => list.refetch()}
                    retrying={list.isRefetching && !list.isFetchingNextPage}
                />
            );
        }

        if (hasActiveFilters) {
            return (
                <EmptyState
                    title="Nenhum jogo com essa modalidade"
                    description="Tente outra modalidade."
                    actionLabel="Limpar filtros"
                    onAction={clearFilters}
                />
            );
        }

        return (
            <EmptyState
                title="Nenhum jogo nesta temporada"
                description="Os jogos aparecem aqui assim que forem agendados."
            />
        );
    };

    const renderModalityRow = () => {
        if (modalities.isPending) {
            return <ThemedText variant="caption">Carregando modalidades…</ThemedText>;
        }

        if (modalities.isError) {
            return (
                <View style={styles.inlineError}>
                    <ThemedText variant="caption">Não foi possível carregar as modalidades.</ThemedText>
                    <Button
                        title="Tentar de novo"
                        variant="neutral"
                        size="compact"
                        onPress={() => modalities.refetch()}
                        loading={modalities.isRefetching}
                    />
                </View>
            );
        }

        if (modalityOptions.length <= 1) {
            return null;
        }

        return (
            <FilterChips
                accessibilityLabel="Filtrar por modalidade"
                options={modalityOptions}
                selected={modalityFilter}
                onSelect={setModalityFilter}
            />
        );
    };

    return (
        <SectionList<MatchListItemResponse, GameSection>
            sections={sections}
            keyExtractor={(item) => item.match_id}
            stickySectionHeadersEnabled={false}
            renderSectionHeader={renderSectionHeader}
            renderItem={renderItem}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={contentStyle}
            ItemSeparatorComponent={MatchSeparator}
            SectionSeparatorComponent={SectionSeparator}
            ListHeaderComponent={
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <ThemedText variant="body" style={styles.seasonLabel}>
                            {season.data.name} · {season.data.year}
                        </ThemedText>
                        <View style={styles.bellButton}>
                            <Icon name="bell" size={20} color={colors.ink} />
                        </View>
                    </View>
                    {renderModalityRow()}
                    {list.isError && matches.length > 0 ? (
                        <View style={styles.inlineError}>
                            <ThemedText variant="caption">Não foi possível atualizar. Mostrando os dados salvos.</ThemedText>
                            <Button title="Tentar de novo" variant="neutral" size="compact" onPress={() => list.refetch()} />
                        </View>
                    ) : null}
                </View>
            }
            ListEmptyComponent={renderListEmpty}
            ListFooterComponent={list.isFetchingNextPage ? <LoadingState label="Carregando mais jogos…" /> : null}
            onEndReached={() => {
                if (list.hasNextPage && !list.isFetchingNextPage) {
                    list.fetchNextPage();
                }
            }}
            onEndReachedThreshold={0.4}
            refreshControl={
                <RefreshControl
                    refreshing={(list.isRefetching && !list.isFetchingNextPage) || season.isRefetching}
                    onRefresh={() => {
                        season.refetch();
                        modalities.refetch();
                        list.refetch();
                    }}
                />
            }
        />
    );
}

const styles = StyleSheet.create({
    content: {
        paddingBottom: spacing.xl,
    },
    contentFill: {
        flexGrow: 1,
    },
    header: {
        gap: spacing.sm,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
    },
    seasonLabel: {
        color: colors.textSecondary,
    },
    bellButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.field,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.xs,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    sectionTrailing: {
        color: colors.textSecondary,
    },
    liveDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.danger,
    },
    separator: {
        height: spacing.sm,
    },
    sectionSeparator: {
        height: 0,
    },
    inlineError: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
    },
});
