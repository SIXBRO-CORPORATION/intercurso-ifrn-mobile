import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ListRowIcon, MatchListRow } from '@/components/list-row';
import { ManagementCard } from '@/components/management/management-card';
import { ManagementGuard } from '@/components/management/management-guard';
import { LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useAllModalities } from '@/hooks/useModalities';
import { useStartMatch, useMatchList } from '@/hooks/useMatches';
import { useActiveSeason, useSeasonDetails, useSeasons } from '@/hooks/useSeasons';
import { useTeams } from '@/hooks/useTeams';
import { ApiError } from '@/types/api';
import { SeasonStatusLabel } from '@/types/enums';
import { colors, radius, shadows, spacing } from '@/theme';
import { formatCampusTime } from '@/utils/campus-time';
import type { MatchListItemResponse } from '@/types/match-list';

const NO_ACTIVE_SEASON_STATUS = 400;
const UPCOMING_MATCHES_LIMIT = 2;

function ActiveSeasonCard() {
    const season = useActiveSeason();
    const details = useSeasonDetails(season.data?.season_id ?? '');

    if (season.isPending) {
        return (
            <View style={[styles.heroCard, styles.heroFallback]}>
                <ActivityIndicator color={colors.primary} />
                <ThemedText variant="body" style={styles.heroFallbackText}>
                    Carregando temporada…
                </ThemedText>
            </View>
        );
    }

    if (season.isError) {
        if (season.error instanceof ApiError && season.error.status === NO_ACTIVE_SEASON_STATUS) {
            return (
                <View style={[styles.heroCard, styles.heroFallback]}>
                    <ThemedText variant="section" style={styles.heroFallbackTitle}>
                        Nenhuma temporada ativa
                    </ThemedText>
                    <ThemedText variant="body" style={styles.heroFallbackText}>
                        Crie uma temporada para liberar as inscrições.
                    </ThemedText>
                    <Button
                        title="Criar temporada"
                        variant="dark"
                        size="compact"
                        onPress={() => router.push('/seasons/create')}
                    />
                </View>
            );
        }

        return (
            <View style={[styles.heroCard, styles.heroFallback]}>
                <ThemedText variant="body" style={styles.heroFallbackText}>
                    Não foi possível carregar a temporada ativa.
                </ThemedText>
                <Button
                    title="Tentar de novo"
                    variant="outline"
                    size="compact"
                    onPress={() => season.refetch()}
                    loading={season.isRefetching}
                />
            </View>
        );
    }

    const data = season.data;
    const stats = details.data;

    return (
        <LinearGradient colors={colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
            <View style={styles.heroTop}>
                <ThemedText variant="overline" style={styles.heroOverline}>
                    Temporada ativa
                </ThemedText>
                <View style={styles.heroPill}>
                    <View style={styles.heroPillDot} />
                    <ThemedText variant="label" style={styles.heroPillLabel}>
                        {SeasonStatusLabel[data.status]}
                    </ThemedText>
                </View>
            </View>
            <ThemedText variant="title" style={styles.heroTitle} numberOfLines={1}>
                {data.name}
            </ThemedText>
            <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                    <ThemedText variant="largeTitle" style={styles.heroStatValue}>
                        {stats ? stats.total_teams_created : '—'}
                    </ThemedText>
                    <ThemedText variant="label" style={styles.heroStatLabel}>
                        Criados
                    </ThemedText>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                    <ThemedText variant="largeTitle" style={styles.heroStatValue}>
                        {stats ? stats.total_teams_submitted : '—'}
                    </ThemedText>
                    <ThemedText variant="label" style={styles.heroStatLabel}>
                        Submetidos
                    </ThemedText>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                    <ThemedText variant="largeTitle" style={styles.heroStatValue}>
                        {stats ? stats.total_teams_approved : '—'}
                    </ThemedText>
                    <ThemedText variant="label" style={styles.heroStatLabel}>
                        Aprovados
                    </ThemedText>
                </View>
            </View>
        </LinearGradient>
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
    const seasons = useSeasons();
    const modalities = useAllModalities();
    const activeSeason = useActiveSeason();

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

            <ActiveSeasonCard />
            <PendingTeamsBanner seasonId={activeSeason.data?.season_id} />

            <View style={styles.cardsRow}>
                <View style={styles.cardsRowItem}>
                    <ManagementCard
                        title="Temporadas"
                        subtitle={seasons.isPending ? 'Carregando…' : `${seasons.data?.length ?? 0} cadastradas`}
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
            </View>

            {activeSeason.data ? <UpcomingMatches seasonId={activeSeason.data.season_id} /> : null}
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
    heroCard: {
        borderRadius: radius.xl,
        borderCurve: 'continuous',
        padding: spacing.lg,
        gap: spacing.md,
        boxShadow: shadows.card,
    },
    heroFallback: {
        backgroundColor: colors.field,
        alignItems: 'flex-start',
    },
    heroFallbackTitle: {
        color: colors.ink,
    },
    heroFallbackText: {
        color: colors.textSecondary,
    },
    heroTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    heroOverline: {
        color: colors.primarySoft,
    },
    heroPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        backgroundColor: 'rgba(255,255,255,0.22)',
    },
    heroPillDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.surface,
    },
    heroPillLabel: {
        color: colors.surface,
    },
    heroTitle: {
        color: colors.surface,
    },
    heroStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    heroStat: {
        flex: 1,
        gap: 2,
    },
    heroStatValue: {
        color: colors.surface,
    },
    heroStatLabel: {
        color: colors.primarySoft,
    },
    heroDivider: {
        width: 1,
        alignSelf: 'stretch',
        marginHorizontal: spacing.md,
        backgroundColor: 'rgba(255,255,255,0.3)',
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
        gap: spacing.md,
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
});
