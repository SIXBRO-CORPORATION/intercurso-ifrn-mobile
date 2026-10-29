import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { useLiveClock } from '@/components/match/match-helpers';
import { formatCampusTime, formatMatchClock, formatCampusShortDate } from '@/utils/campus-time';
import { colors, radius, shadows, spacing } from '@/theme';
import type { MatchListItemResponse } from '@/types/match-list';
import type { MatchTeamResponse } from '@/types/match';

type MatchCardProps = {
    match: MatchListItemResponse;
    dataUpdatedAt: number;
};

function initialsOf(name: string): string {
    const letters = name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join('');
    return letters || '?';
}

function TeamColumn({ team, align }: { team: MatchTeamResponse | null | undefined; align: 'left' | 'right' }) {
    const name = team?.name ?? 'A definir';

    return (
        <View style={[styles.teamColumn, align === 'right' && styles.teamColumnRight]}>
            <View style={styles.teamAvatar}>
                <ThemedText variant="section" style={styles.teamAvatarText}>
                    {team ? initialsOf(name) : '?'}
                </ThemedText>
            </View>
            <ThemedText variant="bodyLg" numberOfLines={1} style={styles.teamName}>
                {name}
            </ThemedText>
        </View>
    );
}

export const MatchCard = memo(function MatchCard({ match, dataUpdatedAt }: MatchCardProps) {
    const isLive = match.status === 'IN_PROGRESS';
    const isFinished = match.status === 'FINISHED';
    const showScore = match.status !== 'SCHEDULED';

    const liveSeconds = useLiveClock(
        match.match_id,
        match.clock_seconds,
        isLive && match.clock_running,
        dataUpdatedAt
    );

    const team1Name = match.team1?.name ?? 'A definir';
    const team2Name = match.team2?.name ?? 'A definir';

    const topRight = isLive
        ? `${match.current_period}º tempo`
        : isFinished
          ? 'Encerrada'
          : match.scheduled_date
            ? `${formatCampusShortDate(match.scheduled_date)} · ${formatCampusTime(match.scheduled_date)}`
            : 'Sem data';

    return (
        <Link href={`/match/${match.match_id}`} asChild>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${match.modality_name ?? 'Partida'}: ${team1Name} contra ${team2Name}. Abrir partida`}
            >
                {({ pressed }) => (
                    <LinearGradient
                        colors={colors.gradientPrimary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.card, { opacity: pressed ? 0.85 : 1 }]}
                    >
                        <View style={styles.header}>
                            {isLive ? (
                                <View style={styles.livePill}>
                                    <View style={styles.liveDot} />
                                    <ThemedText variant="overline" style={styles.liveText}>
                                        AO VIVO
                                    </ThemedText>
                                </View>
                            ) : (
                                <ThemedText variant="caption" numberOfLines={1} style={styles.headerMuted}>
                                    {match.modality_name ?? 'Partida'}
                                </ThemedText>
                            )}
                            <ThemedText variant="body" style={styles.headerStrong}>
                                {topRight}
                            </ThemedText>
                        </View>

                        <View style={styles.matchRow}>
                            <TeamColumn team={match.team1} align="left" />
                            <View style={styles.scoreColumn}>
                                {showScore ? (
                                    <ThemedText
                                        variant="timer"
                                        style={styles.score}
                                        accessibilityLabel={`${match.team1?.score ?? 0} a ${match.team2?.score ?? 0}`}
                                    >
                                        {match.team1?.score ?? 0}
                                    </ThemedText>
                                ) : null}
                                <View style={styles.scoreDash} />
                                {showScore ? (
                                    <ThemedText variant="timer" style={styles.score}>
                                        {match.team2?.score ?? 0}
                                    </ThemedText>
                                ) : null}
                            </View>
                            <TeamColumn team={match.team2} align="right" />
                        </View>

                        {isLive ? (
                            <View style={styles.clockRow}>
                                <View style={styles.clockPill}>
                                    <View style={styles.liveDot} />
                                    <ThemedText variant="overline" style={styles.liveText}>
                                        {formatMatchClock(liveSeconds)}
                                    </ThemedText>
                                </View>
                            </View>
                        ) : null}
                    </LinearGradient>
                )}
            </Pressable>
        </Link>
    );
});

const styles = StyleSheet.create({
    card: {
        borderRadius: radius.xl,
        borderCurve: 'continuous',
        padding: spacing.lg,
        gap: spacing.md,
        boxShadow: shadows.card,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    headerMuted: {
        flexShrink: 1,
        color: 'rgba(255,255,255,0.85)',
    },
    headerStrong: {
        color: colors.surface,
    },
    livePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        backgroundColor: 'rgba(255,255,255,0.22)',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.surface,
    },
    liveText: {
        color: colors.surface,
    },
    matchRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    teamColumn: {
        flex: 1,
        alignItems: 'center',
        gap: spacing.xs,
    },
    teamColumnRight: {
        alignItems: 'center',
    },
    teamAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.22)',
    },
    teamAvatarText: {
        color: colors.surface,
    },
    teamName: {
        color: colors.surface,
        textAlign: 'center',
    },
    scoreColumn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        minWidth: 96,
        paddingTop: spacing.sm,
    },
    score: {
        color: colors.surface,
        fontSize: 56,
        lineHeight: 60,
    },
    scoreDash: {
        width: 24,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.35)',
    },
    clockRow: {
        alignItems: 'center',
    },
    clockPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        backgroundColor: 'rgba(255,255,255,0.22)',
    },
});
