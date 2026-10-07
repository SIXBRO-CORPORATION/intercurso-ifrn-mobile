import { Pressable, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { formatCampusTime, formatMatchClock, formatCampusShortDate } from '@/utils/campus-time';
import { colors, radius, shadows, spacing, typography, useBrandColors } from '@/theme';
import type { MatchListItemResponse } from '@/types/match-list';
import type { MatchTeamResponse } from '@/types/match';
import type { MatchStatus } from '@/types/enums';

interface MatchCardProps {
    match: MatchListItemResponse;
}

function TeamSlot({ team, align }: { team: MatchTeamResponse | null | undefined; align: 'left' | 'right' }) {
    if (!team) {
        return (
            <View style={[styles.team, align === 'right' && styles.teamRight]}>
                <ThemedText variant="headline" style={styles.pending}>
                    A definir
                </ThemedText>
            </View>
        );
    }

    return (
        <View style={[styles.team, align === 'right' && styles.teamRight]}>
            <ThemedText variant="headline" numberOfLines={2} style={align === 'right' ? styles.right : undefined}>
                {team.name}
            </ThemedText>
        </View>
    );
}

function StatusBadge({ status, clockSeconds, period, scheduledDate }: {
    status: MatchStatus;
    clockSeconds: number;
    period: number;
    scheduledDate?: string | null;
}) {
    const brand = useBrandColors();

    if (status === 'IN_PROGRESS') {
        return (
            <View style={[styles.badge, { backgroundColor: brand.live }]} accessibilityLabel="Ao vivo">
                <ThemedText variant="caption" style={styles.badgeText}>
                    AO VIVO · {period}º · {formatMatchClock(clockSeconds)}
                </ThemedText>
            </View>
        );
    }

    if (status === 'FINISHED') {
        return (
            <View style={[styles.badge, styles.badgeMuted]}>
                <ThemedText variant="caption">Encerrada</ThemedText>
            </View>
        );
    }

    return (
        <View style={[styles.badge, styles.badgeMuted]}>
            <ThemedText variant="caption">
                {scheduledDate ? `${formatCampusShortDate(scheduledDate)} · ${formatCampusTime(scheduledDate)}` : 'Sem data'}
            </ThemedText>
        </View>
    );
}

export function MatchCard({ match }: MatchCardProps) {
    const showScore = match.status !== 'SCHEDULED';
    const team1Name = match.team1?.name ?? 'A definir';
    const team2Name = match.team2?.name ?? 'A definir';

    const summary = [
        match.modality_name,
        match.group_name,
        match.status === 'IN_PROGRESS' ? 'Em andamento' : undefined,
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <Link href={`/match/${match.match_id}`} asChild>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${match.modality_name ?? 'Partida'}: ${team1Name} contra ${team2Name}. Abrir partida`}
            >
                {({ pressed }) => (
                    <View style={[styles.card, { opacity: pressed ? 0.7 : 1 }]}>
                        <View style={styles.header}>
                            <ThemedText variant="caption" numberOfLines={1} style={styles.summary}>
                                {summary || 'Partida'}
                            </ThemedText>
                            <StatusBadge
                                status={match.status}
                                clockSeconds={match.clock_seconds}
                                period={match.current_period}
                                scheduledDate={match.scheduled_date}
                            />
                        </View>

                        <View style={styles.row}>
                            <TeamSlot team={match.team1} align="left" />
                            <View style={styles.scoreBox}>
                                {showScore ? (
                                    <ThemedText
                                        variant="score"
                                        accessibilityLabel={`${match.team1?.score ?? 0} a ${match.team2?.score ?? 0}`}
                                    >
                                        {match.team1?.score ?? 0} × {match.team2?.score ?? 0}
                                    </ThemedText>
                                ) : (
                                    <ThemedText variant="subhead">× </ThemedText>
                                )}
                            </View>
                            <TeamSlot team={match.team2} align="right" />
                        </View>
                    </View>
                )}
            </Pressable>
        </Link>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.secondarySystemBackground as string,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        padding: spacing.md,
        gap: spacing.sm,
        boxShadow: shadows.card,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    summary: {
        flexShrink: 1,
    },
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.full,
    },
    badgeMuted: {
        backgroundColor: colors.separator as string,
    },
    badgeText: {
        color: '#FFFFFF',
        fontVariant: ['tabular-nums'],
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    team: {
        flex: 1,
    },
    teamRight: {
        alignItems: 'flex-end',
    },
    right: {
        textAlign: 'right',
    },
    pending: {
        color: colors.secondaryLabel as string,
        fontFamily: typography.subhead.fontFamily,
        fontStyle: 'italic',
    },
    scoreBox: {
        minWidth: 72,
        alignItems: 'center',
    },
});
