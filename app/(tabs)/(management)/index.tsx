import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ListRowIcon, MatchListRow } from '@/components/list-row';
import { ManagementCard } from '@/components/management/management-card';
import { ManagementGuard } from '@/components/management/management-guard';
import { CurrentSeasonHero, NoSeasonHero } from '@/components/management/season-hero';
import { LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useAllModalities } from '@/hooks/useModalities';
import { useStartMatch, useMatchList } from '@/hooks/useMatches';
import { useSeasonOverview } from '@/hooks/useSeasons';
import { useTeams } from '@/hooks/useTeams';
import { SeasonStatusLabel } from '@/types/enums';
import type { SeasonSummary } from '@/types/season';
import { colors, radius, spacing } from '@/theme';
import { formatCampusDate, formatCampusTime } from '@/utils/campus-time';
import type { MatchListItemResponse } from '@/types/match-list';

const UPCOMING_MATCHES_LIMIT = 2;

function SeasonHeroSection({ overview }: { overview: ReturnType<typeof useSeasonOverview> }) {
    if (overview.isPending) {
        return (
            <View style={[styles.heroFallback, styles.heroFallbackRow]}>
                <ActivityIndicator color={colors.primary} />
                <ThemedText variant="body" style={styles.heroFallbackText}>
                    Carregando temporada…
                </ThemedText>
            </View>
        );
    }

    if (overview.isError) {
        return (
            <View style={styles.heroFallback}>
                <ThemedText variant="body" style={styles.heroFallbackText}>
                    Não foi possível carregar a temporada.
                </ThemedText>
                <Button
                    title="Tentar de novo"
                    variant="outline"
                    size="compact"
                    onPress={() => overview.refetch()}
                    loading={overview.isRefetching}
                />
            </View>
        );
    }

    return overview.current ? <CurrentSeasonHero season={overview.current} /> : <NoSeasonHero />;
}

function LastSeasonRow({ season }: { season: SeasonSummary }) {
    const subtitle = season.finished_at
        ? `Finalizada em ${formatCampusDate(season.finished_at)}`
        : `Finalizada · ${season.year}`;

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <ThemedText variant="heading">Última temporada</ThemedText>
            </View>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${season.name}. ${subtitle}. Abrir`}
                onPress={() => router.push(`/seasons/${season.season_id}`)}
                style={({ pressed }) => [styles.lastSeasonRow, { opacity: pressed ? 0.7 : 1 }]}
            >
                <ListRowIcon background={colors.surface} size={52}>
                    <Icon name="archive" size={22} color={colors.textSecondary} />
                </ListRowIcon>
                <View style={styles.lastSeasonTexts}>
                    <ThemedText variant="section" numberOfLines={1}>
                        {season.name}
                    </ThemedText>
                    <ThemedText variant="bodySm" style={styles.lastSeasonSubtitle}>
                        {subtitle}
                    </ThemedText>
                </View>
                <Icon name="chev_r" size={20} color={colors.textMuted} />
            </Pressable>
        </View>
    );
}

function PendingTeamsBanner({ seasonId }: { seasonId?: string }) {
    const pendingTeams = useTeams({ status: 'SUBMITTED', season_id: seasonId });
    const total = pendingTeams.data?.length ?? 0;

    if (pendingTeams.isPending || pendingTeams.isError || total === 0) {
        return null;
    }

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${total} equipe${total === 1 ? '' : 's'} aguardando, toque para revisar e aprovar`}
            onPress={() => router.push('/(management-teams)/teams')}
            style={({ pressed }) => [styles.pendingBanner, { opacity: pressed ? 0.7 : 1 }]}
        >
            <ListRowIcon background={colors.warning} size={40}>
                <Icon name="clock" size={20} color={colors.surface} />
            </ListRowIcon>
            <View style={styles.pendingBannerTexts}>
                <ThemedText variant="section">{`${total} equipe${total === 1 ? '' : 's'} aguardando`}</ThemedText>
                <ThemedText variant="bodySm" style={styles.pendingBannerSubtitle}>
                    Toque para revisar e aprovar
                </ThemedText>
            </View>
            <Icon name="chev_r" size={20} color={colors.warningText} />
        </Pressable>
    );
}

function UpcomingMatches({ seasonId }: { seasonId: string }) {
    const list = useMatchList({ seasonId, status: 'SCHEDULED' }, !!seasonId);
    const startMatch = useStartMatch();
    const [startingMatchId, setStartingMatchId] = useState<string | undefined>(undefined);

    const matches: MatchListItemResponse[] = list.data?.pages.flatMap((page) => page.items) ?? [];
    const upcoming = matches.slice(0, UPCOMING_MATCHES_LIMIT);

    if (list.isPending) {
        return null;
    }

    const handleStart = (match: MatchListItemResponse) => {
        setStartingMatchId(match.match_id);
        startMatch.mutate(
            { matchId: match.match_id },
            {
                onSuccess: () => {
                    router.push(`/seasons/${seasonId}/bracket/match/${match.match_id}`);
                },
                onSettled: () => setStartingMatchId(undefined),
            }
        );
    };

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <ThemedText variant="heading">Próximas partidas</ThemedText>
                {upcoming.length > 0 ? (
                    <ThemedText
                        variant="body"
                        style={styles.sectionAction}
                        onPress={() => router.push('/(management-matches)/matches')}
                    >
                        Ver todas
                    </ThemedText>
                ) : null}
            </View>
            {upcoming.length === 0 ? (
                <ThemedText variant="body" style={styles.emptyMatchesText}>
                    Nenhuma partida agendada ainda.
                </ThemedText>
            ) : (
                <View style={styles.matchList}>
                    {upcoming.map((match) => (
                        <MatchListRow
                            key={match.match_id}
                            team1={{ name: match.team1?.name ?? 'A definir' }}
                            team2={{ name: match.team2?.name ?? 'A definir' }}
                            trailing={
                                <View style={styles.matchTrailing}>
                                    <ThemedText variant="section">
                                        {match.scheduled_date ? formatCampusTime(match.scheduled_date) : 'Sem data'}
                                    </ThemedText>
                                    <Button
                                        title="Iniciar"
                                        size="small"
                                        loading={startingMatchId === match.match_id}
                                        onPress={() => handleStart(match)}
                                    />
                                </View>
                            }
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

function ManagementHub() {
    const { user } = useAuth();
    const overview = useSeasonOverview();
    const modalities = useAllModalities();
    const current = overview.current;
    const showEmptyState = !overview.isPending && !overview.isError && !current;

    const seasonShortcutSubtitle = overview.isPending
        ? 'Carregando…'
        : current
          ? SeasonStatusLabel[current.status]
          : 'Nenhuma ativa';

    return (
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
            <View style={styles.headerRow}>
                <View style={styles.headerTexts}>
                    <ThemedText variant="largeTitle">Painel</ThemedText>
                    <ThemedText variant="body" style={styles.headerSubtitle}>
                        Olá, {user?.name?.split(' ')[0] ?? 'Monitor'}
                    </ThemedText>
                </View>
            </View>

            <SeasonHeroSection overview={overview} />
            {current ? <PendingTeamsBanner seasonId={current.season_id} /> : null}

            <View style={styles.cardsRow}>
                <View style={styles.cardsRowItem}>
                    <ManagementCard
                        title="Temporada"
                        subtitle={seasonShortcutSubtitle}
                        href="/seasons"
                        icon="calendar"
                    />
                </View>
                <View style={styles.cardsRowItem}>
                    <ManagementCard
                        title="Modalidades"
                        subtitle={modalities.isPending ? 'Carregando…' : `${modalities.data?.length ?? 0} ativas`}
                        href="/modalities"
                        icon="tag"
                    />
                </View>
                <View style={styles.cardsRowItem}>
                    <ManagementCard
                        title="Histórico"
                        subtitle={overview.isPending ? 'Carregando…' : `${overview.finished.length} anteriores`}
                        href="/seasons/history"
                        icon="history"
                    />
                </View>
            </View>

            {showEmptyState && overview.lastFinished ? <LastSeasonRow season={overview.lastFinished} /> : null}
            {current ? <UpcomingMatches seasonId={current.season_id} /> : null}
        </ScrollView>
    );
}

export default function ManagementScreen() {
    const { isInitializing } = useAuth();

    if (isInitializing) {
        return <LoadingState label="Carregando…" />;
    }

    return (
        <ManagementGuard>
            <ManagementHub />
        </ManagementGuard>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        gap: spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xs,
        paddingBottom: spacing.xs,
    },
    headerTexts: {
        gap: 2,
    },
    headerSubtitle: {
        color: colors.textSecondary,
    },
    heroFallback: {
        gap: spacing.sm,
        alignItems: 'flex-start',
        padding: spacing.lg,
        borderRadius: radius.hero,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    heroFallbackRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    heroFallbackText: {
        color: colors.textSecondary,
    },
    pendingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.xl,
        borderCurve: 'continuous',
        backgroundColor: colors.warningSoft,
    },
    pendingBannerTexts: {
        flex: 1,
        gap: 2,
    },
    pendingBannerSubtitle: {
        color: colors.warningText,
    },
    matchTrailing: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    cardsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    cardsRowItem: {
        flex: 1,
    },
    section: {
        gap: spacing.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xs,
    },
    sectionAction: {
        color: colors.primary,
    },
    matchList: {
        gap: spacing.sm,
    },
    emptyMatchesText: {
        color: colors.textSecondary,
        paddingHorizontal: spacing.xs,
    },
    lastSeasonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.xl,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    lastSeasonTexts: {
        flex: 1,
        gap: 2,
    },
    lastSeasonSubtitle: {
        color: colors.textSecondary,
    },
});
