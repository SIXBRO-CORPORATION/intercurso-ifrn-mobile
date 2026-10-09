import { StyleSheet, View } from 'react-native';
import { TeamAvatar } from '@/components/teams/team-avatar';
import { ThemedText } from '@/components/themed-text';
import type { MatchPublicResponse } from '@/types/match';
import { MatchStatusLabel } from '@/types/enums';
import { colors, radius, shadows, spacing, useBrandColors } from '@/theme';
import { formatCampusDateTime, formatMatchClock } from '@/utils/campus-time';
import { teamName, useLiveClock } from './match-helpers';

function StatusLine({ match, dataUpdatedAt }: { match: MatchPublicResponse; dataUpdatedAt: number }) {
    const brand = useBrandColors();
    const liveSeconds = useLiveClock(
        match.match_id,
        match.clock_seconds,
        match.clock_running && match.status === 'IN_PROGRESS',
        dataUpdatedAt
    );

    if (match.status === 'IN_PROGRESS') {
        return (
            <View style={[styles.badge, { backgroundColor: brand.live }]} accessibilityLabel="Ao vivo">
                <ThemedText variant="caption" style={styles.badgeText}>
                    AO VIVO · {match.current_period}º · {formatMatchClock(liveSeconds)}
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

export function MatchScoreHeader({
    match,
    dataUpdatedAt,
}: {
    match: MatchPublicResponse;
    dataUpdatedAt: number;
}) {
    const showScore = match.status !== 'SCHEDULED';
    const winner = match.status === 'FINISHED' ? teamName(match, match.winner_id) : undefined;

    return (
        <View style={styles.scoreCard}>
            <StatusLine match={match} dataUpdatedAt={dataUpdatedAt} />

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

const styles = StyleSheet.create({
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
});
