import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import type { MatchPublicResponse } from '@/types/match';
import { colors, radius, shadows, spacing } from '@/theme';
import { formatCampusDateTime, formatMatchClock } from '@/utils/campus-time';
import { useLiveClock } from './match-helpers';

const TRANSLUCENT = 'rgba(255,255,255,0.22)';
const MUTED_ON_BRAND = 'rgba(255,255,255,0.85)';
const FAINT_ON_BRAND = 'rgba(255,255,255,0.35)';

function initialsOf(name: string): string {
    const letters = name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join('');
    return letters || '?';
}

function StatusPill({ label, dotted = false }: { label: string; dotted?: boolean }) {
    return (
        <View style={styles.statusPill} accessibilityLabel={label}>
            {dotted ? <View style={styles.statusDot} /> : null}
            <ThemedText variant="overline" style={styles.statusLabel}>
                {label}
            </ThemedText>
        </View>
    );
}

function HeaderRow({ match }: { match: MatchPublicResponse }) {
    if (match.status === 'IN_PROGRESS') {
        return (
            <View style={styles.headerRow}>
                <StatusPill label="AO VIVO" dotted />
                <ThemedText variant="body" style={styles.headerRight}>
                    {match.current_period}º tempo
                </ThemedText>
            </View>
        );
    }

    if (match.status === 'FINISHED') {
        const rightLabel = match.penalty_result
            ? 'Pênaltis'
            : match.finished_at
              ? formatCampusDateTime(match.finished_at)
              : '';

        return (
            <View style={styles.headerRow}>
                <StatusPill label="ENCERRADA" />
                {rightLabel ? (
                    <ThemedText variant="body" style={styles.headerRight}>
                        {rightLabel}
                    </ThemedText>
                ) : null}
            </View>
        );
    }

    return (
        <View style={styles.headerRow}>
            <StatusPill label="AGENDADA" />
            <ThemedText variant="body" style={styles.headerRight}>
                {match.scheduled_date ? formatCampusDateTime(match.scheduled_date) : 'Sem data definida'}
            </ThemedText>
        </View>
    );
}

function TeamColumn({ name, isWinner }: { name: string; isWinner: boolean }) {
    return (
        <View style={styles.teamColumn}>
            <View style={styles.avatarWrap}>
                {isWinner ? (
                    <View style={styles.trophyBadge}>
                        <Icon name="trophy" size={14} color={colors.primaryDark} />
                    </View>
                ) : null}
                <View style={styles.avatar}>
                    <ThemedText variant="heading" style={styles.avatarText}>
                        {initialsOf(name)}
                    </ThemedText>
                </View>
            </View>
            <ThemedText variant="bodyLg" numberOfLines={2} style={styles.teamName}>
                {name}
            </ThemedText>
        </View>
    );
}

export function MatchScoreHeader({
    match,
    dataUpdatedAt,
}: {
    match: MatchPublicResponse;
    dataUpdatedAt: number;
}) {
    const isLive = match.status === 'IN_PROGRESS';
    const isFinished = match.status === 'FINISHED';
    const showScore = match.status !== 'SCHEDULED';
    const penaltyResult = match.penalty_result;

    const liveSeconds = useLiveClock(
        match.match_id,
        match.clock_seconds,
        match.clock_running && isLive,
        dataUpdatedAt
    );

    return (
        <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
        >
            <HeaderRow match={match} />

            <View style={styles.teamsRow}>
                <TeamColumn
                    name={match.team1.name}
                    isWinner={isFinished && !!match.winner_id && match.winner_id === match.team1.team_id}
                />

                <View style={styles.scoreBox}>
                    <View style={styles.scoreRow}>
                        {showScore ? (
                            <ThemedText
                                variant="timer"
                                style={styles.scoreNumber}
                                accessibilityLabel={`${match.team1.score} a ${match.team2.score}`}
                            >
                                {match.team1.score}
                            </ThemedText>
                        ) : null}
                        <View style={styles.scoreDash} />
                        {showScore ? (
                            <ThemedText variant="timer" style={styles.scoreNumber}>
                                {match.team2.score}
                            </ThemedText>
                        ) : null}
                    </View>

                    {penaltyResult ? (
                        <View style={styles.penaltyRow}>
                            <ThemedText variant="bodyLg" style={styles.penaltyNumber}>
                                ({penaltyResult.team1_penalties})
                            </ThemedText>
                            <View style={styles.penaltySpacer} />
                            <ThemedText variant="bodyLg" style={styles.penaltyNumber}>
                                ({penaltyResult.team2_penalties})
                            </ThemedText>
                        </View>
                    ) : null}

                    {isLive ? (
                        <View style={styles.clockPill} accessibilityLabel={`Relógio: ${formatMatchClock(liveSeconds)}`}>
                            <View style={styles.statusDot} />
                            <ThemedText variant="overline" style={styles.clockLabel}>
                                {formatMatchClock(liveSeconds)}
                            </ThemedText>
                        </View>
                    ) : null}
                </View>

                <TeamColumn
                    name={match.team2.name}
                    isWinner={isFinished && !!match.winner_id && match.winner_id === match.team2.team_id}
                />
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    card: {
        gap: spacing.lg,
        padding: spacing.xl,
        borderRadius: radius.hero,
        borderCurve: 'continuous',
        boxShadow: shadows.card,
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        backgroundColor: TRANSLUCENT,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.surface,
    },
    statusLabel: {
        color: colors.surface,
    },
    headerRight: {
        color: MUTED_ON_BRAND,
    },
    teamsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        width: '100%',
        gap: spacing.sm,
    },
    teamColumn: {
        flex: 1,
        alignItems: 'center',
        gap: spacing.xs,
    },
    avatarWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.sm,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: TRANSLUCENT,
    },
    avatarText: {
        color: colors.surface,
    },
    trophyBadge: {
        position: 'absolute',
        top: -10,
        zIndex: 1,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
    },
    teamName: {
        color: colors.surface,
        textAlign: 'center',
    },
    scoreBox: {
        minWidth: 120,
        alignItems: 'center',
        gap: spacing.xs,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    scoreNumber: {
        color: colors.surface,
        fontSize: 56,
        lineHeight: 60,
    },
    scoreDash: {
        width: 24,
        height: 6,
        borderRadius: 3,
        backgroundColor: FAINT_ON_BRAND,
    },
    penaltyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    penaltyNumber: {
        flex: 1,
        color: MUTED_ON_BRAND,
        textAlign: 'center',
    },
    penaltySpacer: {
        width: 24,
    },
    clockPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        backgroundColor: TRANSLUCENT,
    },
    clockLabel: {
        color: colors.surface,
        fontVariant: ['tabular-nums'],
    },
});
