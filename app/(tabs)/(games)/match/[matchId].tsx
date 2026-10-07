import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { InfoRow, Section } from '@/components/management/section';
import { ErrorState, LoadingState } from '@/components/states/screen-states';
import { TeamAvatar } from '@/components/teams/team-avatar';
import { ThemedText } from '@/components/themed-text';
import { useMatchDetails } from '@/hooks/useMatches';
import { useMatchLive } from '@/hooks/useRealtime';
import type { MatchPublicResponse, MatchTimelineEventResponse } from '@/types/match';
import { EventTypeLabel, MatchCategoryLabel, MatchStatusLabel, MatchTypeLabel } from '@/types/enums';
import { colors, radius, shadows, spacing, useBrandColors } from '@/theme';
import { formatCampusDateTime, formatMatchClock } from '@/utils/campus-time';
import { friendlyErrorMessage } from '@/utils/api-error-message';

function teamName(match: MatchPublicResponse, teamId?: string | null): string | undefined {
    if (!teamId) return undefined;
    if (match.team1.team_id === teamId) return match.team1.name;
    if (match.team2.team_id === teamId) return match.team2.name;
    return undefined;
}

function playerName(match: MatchPublicResponse, playerId?: string | null): string | undefined {
    if (!playerId) return undefined;
    return [...match.team1_players, ...match.team2_players].find((player) => player.user_id === playerId)?.name;
}

function StatusLine({ match }: { match: MatchPublicResponse }) {
    const brand = useBrandColors();

    if (match.status === 'IN_PROGRESS') {
        return (
            <View style={[styles.badge, { backgroundColor: brand.live }]} accessibilityLabel="Ao vivo">
                <ThemedText variant="caption" style={styles.badgeText}>
                    AO VIVO · {match.current_period}º · {formatMatchClock(match.clock_seconds)}
                </ThemedText>
            </View>
        );
    }

    if (match.status === 'FINISHED') {
        return (
            <ThemedText variant="caption" style={styles.statusCaption}>
                {MatchStatusLabel.FINISHED}
                {match.finished_at ? ` · ${formatCampusDateTime(match.finished_at)}` : ''}
            </ThemedText>
        );
    }

    return (
        <ThemedText variant="caption" style={styles.statusCaption}>
            {match.scheduled_date ? formatCampusDateTime(match.scheduled_date) : 'Sem data definida'}
        </ThemedText>
    );
}

function ScoreHeader({ match }: { match: MatchPublicResponse }) {
    const showScore = match.status !== 'SCHEDULED';
    const winner = match.status === 'FINISHED' ? teamName(match, match.winner_id) : undefined;

    return (
        <View style={styles.scoreCard}>
            <StatusLine match={match} />

            <View style={styles.teamsRow}>
                <View style={styles.teamColumn}>
                    <TeamAvatar name={match.team1.name} photo={match.team1.photo} size={56} />
                    <ThemedText variant="headline" numberOfLines={2} style={styles.teamName}>
                        {match.team1.name}
                    </ThemedText>
                </View>

                <View style={styles.scoreBox}>
                    {showScore ? (
                        <ThemedText
                            variant="score"
                            accessibilityLabel={`${match.team1.score} a ${match.team2.score}`}
                        >
                            {match.team1.score} × {match.team2.score}
                        </ThemedText>
                    ) : (
                        <ThemedText variant="title">×</ThemedText>
                    )}
                    {match.penalty_result ? (
                        <ThemedText variant="caption">
                            Pênaltis {match.penalty_result.team1_penalties} × {match.penalty_result.team2_penalties}
                        </ThemedText>
                    ) : null}
                </View>

                <View style={styles.teamColumn}>
                    <TeamAvatar name={match.team2.name} photo={match.team2.photo} size={56} />
                    <ThemedText variant="headline" numberOfLines={2} style={styles.teamName}>
                        {match.team2.name}
                    </ThemedText>
                </View>
            </View>

            {winner ? (
                <ThemedText variant="subhead" style={styles.winner}>
                    Vencedor: {winner}
                </ThemedText>
            ) : null}
        </View>
    );
}

function TimelineRow({ event, match }: { event: MatchTimelineEventResponse; match: MatchPublicResponse }) {
    const parts = [EventTypeLabel[event.event_type], teamName(match, event.team_id), playerName(match, event.player_id)]
        .filter((part): part is string => Boolean(part));

    return (
        <View style={styles.timelineRow}>
            <ThemedText variant="caption" style={styles.timelineClock}>
                {formatMatchClock(event.clock_seconds)}
            </ThemedText>
            <ThemedText variant="subhead" style={styles.timelineText}>
                {parts.join(' · ')}
            </ThemedText>
        </View>
    );
}

function MatchDetailsContent({ matchId }: { matchId: string }) {
    const details = useMatchDetails(matchId);
    const live = useMatchLive(matchId);
    const match = details.data;

    const refresh = () => details.refetch();

    if (details.isPending) {
        return <LoadingState label="Carregando partida…" />;
    }

    if (details.isError || !match) {
        return (
            <ErrorState
                title="Não foi possível carregar a partida"
                description={friendlyErrorMessage(details.error, 'Tente de novo.')}
                onRetry={refresh}
                retrying={details.isRefetching}
            />
        );
    }

    const showReconnectHint =
        match.status === 'IN_PROGRESS' && (live.status === 'reconnecting' || live.status === 'error');

    return (
        <>
            <Stack.Screen options={{ title: match.modality_name ?? 'Partida' }} />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={details.isRefetching} onRefresh={refresh} />}
            >
                <ScoreHeader match={match} />

                {showReconnectHint ? (
                    <ThemedText variant="caption" style={styles.liveHint}>
                        Reconectando à transmissão ao vivo… o placar pode estar desatualizado.
                    </ThemedText>
                ) : null}

                <Section title="Detalhes">
                    <InfoRow label="Modalidade" value={match.modality_name ?? '—'} />
                    <InfoRow label="Fase" value={MatchTypeLabel[match.match_type]} />
                    <InfoRow label="Categoria" value={MatchCategoryLabel[match.match_category]} />
                    <InfoRow label="Status" value={MatchStatusLabel[match.status]} />
                </Section>

                {match.sets.length > 0 ? (
                    <Section title="Sets">
                        {match.sets.map((set) => (
                            <InfoRow
                                key={set.set_number}
                                label={`Set ${set.set_number}`}
                                value={`${set.team1_points} × ${set.team2_points}`}
                            />
                        ))}
                    </Section>
                ) : null}

                <Section title="Linha do tempo">
                    {match.timeline.length > 0 ? (
                        match.timeline.map((event) => (
                            <TimelineRow key={event.event_id} event={event} match={match} />
                        ))
                    ) : (
                        <ThemedText variant="subhead">Nenhum evento registrado ainda.</ThemedText>
                    )}
                </Section>
            </ScrollView>
        </>
    );
}

export default function MatchDetailsScreen() {
    const { matchId } = useLocalSearchParams<{ matchId: string }>();

    return <MatchDetailsContent matchId={matchId} />;
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.md,
    },
    scoreCard: {
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.secondarySystemBackground as string,
        boxShadow: shadows.card,
        alignItems: 'center',
    },
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.full,
    },
    badgeText: {
        color: '#FFFFFF',
        fontVariant: ['tabular-nums'],
    },
    statusCaption: {
        textAlign: 'center',
    },
    teamsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: spacing.sm,
    },
    teamColumn: {
        flex: 1,
        alignItems: 'center',
        gap: spacing.xs,
    },
    teamName: {
        textAlign: 'center',
    },
    scoreBox: {
        minWidth: 96,
        alignItems: 'center',
        gap: spacing.xs,
    },
    winner: {
        textAlign: 'center',
    },
    liveHint: {
        textAlign: 'center',
        color: colors.secondaryLabel as string,
    },
    timelineRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        minHeight: 28,
        alignItems: 'flex-start',
    },
    timelineClock: {
        width: 48,
        fontVariant: ['tabular-nums'],
    },
    timelineText: {
        flex: 1,
    },
});
