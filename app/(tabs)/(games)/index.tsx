import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Button } from '@/components/button';
import { FilterChips, type FilterChipOption } from '@/components/filter-chips';
import { MatchCard } from '@/components/match-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useActiveSeason } from '@/hooks/useSeasons';
import { useModalities } from '@/hooks/useModalities';
import { useMatchList } from '@/hooks/useMatches';
import { useSeasonLive } from '@/hooks/useRealtime';
import { getCampusDayRange, type RelativeDay } from '@/utils/campus-time';
import { ApiError } from '@/types/api';
import { spacing } from '@/theme';
import type { MatchStatus } from '@/types/enums';
import type { MatchListFilters, MatchListItemResponse } from '@/types/match-list';

type DateFilter = 'all' | RelativeDay;
type StatusFilter = 'ALL' | MatchStatus;

const DATE_OPTIONS: FilterChipOption<DateFilter>[] = [
    { value: 'all', label: 'Todos' },
    { value: 'yesterday', label: 'Ontem' },
    { value: 'today', label: 'Hoje' },
    { value: 'tomorrow', label: 'Amanhã' },
];

const STATUS_OPTIONS: FilterChipOption<StatusFilter>[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'IN_PROGRESS', label: 'Ao vivo' },
    { value: 'SCHEDULED', label: 'Agendadas' },
    { value: 'FINISHED', label: 'Encerradas' },
];

const DEFAULT_DATE_FILTER: DateFilter = 'today';
const DEFAULT_STATUS_FILTER: StatusFilter = 'ALL';

const NO_ACTIVE_SEASON_STATUS = 400;

function errorMessage(error: unknown, fallback: string): string {
    return error instanceof ApiError ? error.message : fallback;
}

export default function GamesScreen() {
    const [modalityFilter, setModalityFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<DateFilter>(DEFAULT_DATE_FILTER);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(DEFAULT_STATUS_FILTER);

    const season = useActiveSeason();
    const seasonId = season.data?.season_id;

    useSeasonLive(seasonId);

    const modalities = useModalities(seasonId);

    const listFilters = useMemo<MatchListFilters | undefined>(() => {
        if (!seasonId) return undefined;

        const filters: MatchListFilters = { seasonId };

        if (modalityFilter !== 'all') filters.modalityId = modalityFilter;
        if (statusFilter !== 'ALL') filters.status = statusFilter;
        if (dateFilter !== 'all') {
            const range = getCampusDayRange(dateFilter);
            filters.dateFrom = range.dateFrom;
            filters.dateTo = range.dateTo;
        }

        return filters;
    }, [seasonId, modalityFilter, dateFilter, statusFilter]);

    const list = useMatchList(listFilters ?? { seasonId: '' }, !!listFilters);

    const matches: MatchListItemResponse[] = list.data?.pages.flatMap((page) => page.items) ?? [];
    const hasActiveFilters =
        modalityFilter !== 'all' || dateFilter !== DEFAULT_DATE_FILTER || statusFilter !== DEFAULT_STATUS_FILTER;

    const clearFilters = () => {
        setModalityFilter('all');
        setDateFilter(DEFAULT_DATE_FILTER);
        setStatusFilter(DEFAULT_STATUS_FILTER);
    };

    const modalityOptions: FilterChipOption<string>[] = [
        { value: 'all', label: 'Todas' },
        ...(modalities.data ?? []).map((m) => ({ value: m.modality_id, label: m.name })),
    ];

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
                    title="Nenhum jogo com esses filtros"
                    description="Tente outra data, status ou modalidade."
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

    const renderModalityHeader = () => {
        if (modalities.isPending) {
            return <ThemedText variant="caption">Carregando modalidades…</ThemedText>;
        }

        if (modalities.isError) {
            return (
                <View style={styles.inlineError}>
                    <ThemedText variant="caption">Não foi possível carregar as modalidades.</ThemedText>
                    <Button
                        title="Tentar de novo"
                        variant="ghost"
                        size="sm"
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
        <FlatList
            data={matches}
            keyExtractor={(item) => item.match_id}
            renderItem={({ item }) => <MatchCard match={item} />}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[styles.content, matches.length === 0 && styles.contentFill]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListHeaderComponent={
                <View style={styles.header}>
                    <ThemedText variant="subhead">
                        {season.data.name} · {season.data.year}
                    </ThemedText>
                    {renderModalityHeader()}
                    <FilterChips accessibilityLabel="Filtrar por data" options={DATE_OPTIONS} selected={dateFilter} onSelect={setDateFilter} />
                    <FilterChips accessibilityLabel="Filtrar por status" options={STATUS_OPTIONS} selected={statusFilter} onSelect={setStatusFilter} />
                    {list.isError && matches.length > 0 ? (
                        <View style={styles.inlineError}>
                            <ThemedText variant="caption">Não foi possível atualizar. Mostrando os dados salvos.</ThemedText>
                            <Button title="Tentar de novo" variant="ghost" size="sm" onPress={() => list.refetch()} />
                        </View>
                    ) : null}
                    {list.isSuccess && matches.length > 0 ? (
                        <ThemedText variant="caption" style={styles.total}>
                            {list.data.pages[0].total} jogo(s)
                        </ThemedText>
                    ) : null}
                </View>
            }
            ListEmptyComponent={renderListEmpty}
            ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator style={styles.footer} /> : null}
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
    separator: {
        height: spacing.sm,
    },
    inlineError: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
    },
    total: {
        paddingHorizontal: spacing.md,
    },
    footer: {
        paddingVertical: spacing.md,
    },
});
