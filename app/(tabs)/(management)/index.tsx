import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { MatchListRow } from '@/components/list-row';
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
import type { MatchListItemResponse } from '@/types/match-list';

const NO_ACTIVE_SEASON_STATUS = 400;
const UPCOMING_MATCHES_LIMIT = 2;

function ActiveSeasonCard() {
    const season = useActiveSeason();
    const details = useSeasonDetails(season.data?.season_id ?? '');

    if (season.isPending) {
        return (
            <View style={[styles.heroCard, styles.heroFallback]}>
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

function PendingTeamsBanner() {
    const pendingTeams = useTeams({ status: 'SUBMITTED' });
    const total = pendingTeams.data?.length ?? 0;

    if (pendingTeams.isPending || pendingTeams.isError || total === 0) {
        return null;
    }

    return (
        <Button
            title={`${total} equipe${total === 1 ? '' : 's'} aguardando`}
            variant="warning"
            icon="clock"
            onPress={() => router.push('/(management-teams)/teams')}
        />
    );
}

function UpcomingMatches({ seasonId }: { seasonId: string }) {
    const list = useMatchList({ seasonId }, !!seasonId);
    const startMatch = useStartMatch();
    const [startingMatchId, setStartingMatchId] = useState<string | undefined>(undefined);

    const matches: MatchListItemResponse[] = list.data?.pages.flatMap((page) => page.items) ?? [];
    const upcoming = matches.filter((match) => match.status === 'SCHEDULED').slice(0, UPCOMING_MATCHES_LIMIT);

    if (list.isPending || upcoming.length === 0) {
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
                <ThemedText
                    variant="body"
                    style={styles.sectionAction}
                    onPress={() => router.push('/(management-matches)/matches')}
                >
                    Ver todas
                </ThemedText>
            </View>
            <View style={styles.matchList}>
                {upcoming.map((match) => (
                    <MatchListRow
                        key={match.match_id}
                        team1={{ name: match.team1?.name ?? 'A definir' }}
                        team2={{ name: match.team2?.name ?? 'A definir' }}
                        trailing={
                            <Button
                                title="Iniciar"
                                size="small"
                                loading={startingMatchId === match.match_id}
                                onPress={() => handleStart(match)}
                            />
                        }
                    />
                ))}
            </View>
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
                <View style={styles.bellButton}>
                    <Icon name="bell" size={20} color={colors.ink} />
                    <View style={styles.bellDot} />
                </View>
            </View>

            <ActiveSeasonCard />
            <PendingTeamsBanner />

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
    bellButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.field,
    },
    bellDot: {
        position: 'absolute',
        top: 10,
        right: 11,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.danger,
        borderWidth: 1.5,
        borderColor: colors.field,
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
});
