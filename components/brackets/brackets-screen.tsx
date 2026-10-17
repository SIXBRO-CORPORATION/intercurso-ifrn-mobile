import { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/button';
import { FilterChips, type FilterChipOption } from '@/components/filter-chips';
import { GroupBracket } from '@/components/brackets/group-bracket';
import { KnockoutBracket, type BracketMatchScoreInfo } from '@/components/brackets/knockout-bracket';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useActiveSeason } from '@/hooks/useSeasons';
import { useModalities } from '@/hooks/useModalities';
import { useBracketDetails, useBracketsBySeason } from '@/hooks/useBrackets';
import { useMatchList } from '@/hooks/useMatches';
import { useSeasonLive } from '@/hooks/useRealtime';
import { ApiError } from '@/types/api';
import type { BracketMatchResponse } from '@/types/bracket';
import { colors, spacing } from '@/theme';

const NO_ACTIVE_SEASON_STATUS = 400;

function errorMessage(error: unknown, fallback: string): string {
    return error instanceof ApiError ? error.message : fallback;
}

function countDistinctTeams(matches: BracketMatchResponse[]): number {
    const ids = new Set<string>();
    matches.forEach((match) => {
        if (match.team1_id) ids.add(match.team1_id);
        if (match.team2_id) ids.add(match.team2_id);
    });
    return ids.size;
}

interface BracketsScreenProps {
    initialModalityId?: string;
}

export function BracketsScreen({ initialModalityId }: BracketsScreenProps) {
    const season = useActiveSeason();
    const seasonId = season.data?.season_id;

    useSeasonLive(seasonId);

    const modalities = useModalities(seasonId);
    const [selectedModalityId, setSelectedModalityId] = useState<string | undefined>(initialModalityId);

    useEffect(() => {
        if (!selectedModalityId && modalities.data && modalities.data.length > 0) {
            setSelectedModalityId(modalities.data[0].modality_id);
        }
    }, [modalities.data, selectedModalityId]);

    const brackets = useBracketsBySeason(seasonId ?? '');
    const bracket = brackets.data?.find((item) => item.modality_id === selectedModalityId);

    const details = useBracketDetails(bracket?.bracket_id ?? '');

    const matchListFilters = seasonId && selectedModalityId ? { seasonId, modalityId: selectedModalityId } : undefined;
    const matchList = useMatchList(matchListFilters ?? { seasonId: '' }, !!matchListFilters);

    useEffect(() => {
        if (matchList.hasNextPage && !matchList.isFetchingNextPage) {
            matchList.fetchNextPage();
        }
    }, [matchList.hasNextPage, matchList.isFetchingNextPage, matchList.fetchNextPage]);

    const matchItems = useMemo(
        () => matchList.data?.pages.flatMap((page) => page.items) ?? [],
        [matchList.data]
    );

    const scoreByMatchId = useMemo(() => {
        const map = new Map<string, BracketMatchScoreInfo>();
        matchItems.forEach((item) => {
            map.set(item.match_id, {
                status: item.status,
                team1Score: item.team1?.score,
                team2Score: item.team2?.score,
            });
        });
        return map;
    }, [matchItems]);

    if (season.isPending) {
        return <LoadingState label="Carregando temporada…" />;
    }

    if (season.isError) {
        if (season.error instanceof ApiError && season.error.status === NO_ACTIVE_SEASON_STATUS) {
            return (
                <EmptyState
                    title="Nenhuma temporada ativa"
                    description="Quando uma temporada começar, as chaves das modalidades aparecerão aqui."
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

    const modalityOptions: FilterChipOption<string>[] = (modalities.data ?? []).map((modality) => ({
        value: modality.modality_id,
        label: modality.name,
    }));

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

        if (modalityOptions.length === 0) {
            return null;
        }

        return (
            <FilterChips
                accessibilityLabel="Selecionar modalidade"
                options={modalityOptions}
                selected={selectedModalityId ?? modalityOptions[0].value}
                onSelect={setSelectedModalityId}
            />
        );
    };

    const renderContent = () => {
        if (!selectedModalityId) {
            if (modalities.isPending) return null;
            return (
                <EmptyState
                    title="Nenhuma modalidade nesta temporada"
                    description="As chaves aparecem aqui assim que houver modalidades cadastradas."
                />
            );
        }

        if (brackets.isPending) {
            return <LoadingState label="Carregando chaveamento…" />;
        }

        if (brackets.isError) {
            return (
                <ErrorState
                    title="Não foi possível carregar o chaveamento"
                    description={errorMessage(brackets.error, 'Verifique sua conexão e tente de novo.')}
                    onRetry={() => brackets.refetch()}
                    retrying={brackets.isRefetching}
                />
            );
        }

        if (!bracket) {
            return (
                <EmptyState
                    title="Chaveamento ainda não disponível"
                    description="O chaveamento desta modalidade aparece aqui assim que o monitor sortear as equipes."
                />
            );
        }

        if (details.isPending) {
            return <LoadingState label="Carregando partidas…" />;
        }

        if (details.isError) {
            return (
                <ErrorState
                    title="Não foi possível carregar as partidas"
                    description={errorMessage(details.error, 'Verifique sua conexão e tente de novo.')}
                    onRetry={() => details.refetch()}
                    retrying={details.isRefetching}
                />
            );
        }

        const allMatches = details.data.matches;
        const knockoutMatches = allMatches.filter((match) => match.match_category === 'KNOCKOUT');
        const showKnockout = bracket.format === 'KNOCKOUT' || knockoutMatches.length > 0;

        if (showKnockout) {
            const matchesToShow = knockoutMatches.length > 0 ? knockoutMatches : allMatches;
            const teamsCount = countDistinctTeams(matchesToShow);
            const isLive = Array.from(scoreByMatchId.values()).some((info) => info.status === 'IN_PROGRESS');

            return (
                <View style={styles.knockoutWrapper}>
                    <View style={styles.subHeader}>
                        <ThemedText variant="label" style={styles.subHeaderLabel}>
                            Mata-mata{teamsCount > 0 ? ` · ${teamsCount} times` : ''}
                        </ThemedText>
                        {isLive ? (
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <ThemedText variant="caption" style={styles.liveBadgeText}>
                                    Atualizado ao vivo
                                </ThemedText>
                            </View>
                        ) : null}
                    </View>
                    <KnockoutBracket matches={matchesToShow} scoreByMatchId={scoreByMatchId} />
                </View>
            );
        }

        return <GroupBracket groups={details.data.groups} matches={matchItems} />;
    };

    return (
        <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={season.isRefetching || brackets.isRefetching}
                    onRefresh={() => {
                        season.refetch();
                        modalities.refetch();
                        brackets.refetch();
                        if (bracket) details.refetch();
                    }}
                />
            }
        >
            <View style={styles.header}>{renderModalityRow()}</View>
            {renderContent()}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingBottom: spacing.xl,
        gap: spacing.lg,
    },
    header: {
        gap: spacing.sm,
        paddingTop: spacing.sm,
    },
    inlineError: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
    },
    knockoutWrapper: {
        gap: spacing.md,
    },
    subHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
    },
    subHeaderLabel: {
        color: colors.textSecondary,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
    },
    liveBadgeText: {
        color: colors.primaryDark,
    },
});
