import { StyleSheet, View } from 'react-native';
import { TeamAvatar } from '@/components/teams/team-avatar';
import { ThemedText } from '@/components/themed-text';
import { colors, fontFamily, radius, spacing } from '@/theme';
import type { BracketGroupTeamResponse } from '@/types/bracket';

interface StandingsTableProps {
    teams: BracketGroupTeamResponse[];
    qualifyingSpots?: number;
}

export function StandingsTable({ teams, qualifyingSpots }: StandingsTableProps) {
    const ordered = teams;
    const spots = qualifyingSpots ?? 0;

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <ThemedText variant="overline" style={styles.headerPos}>
                    #
                </ThemedText>
                <ThemedText variant="overline" style={styles.headerTeam}>
                    Time
                </ThemedText>
                <ThemedText variant="overline" style={styles.headerStat}>
                    P
                </ThemedText>
                <ThemedText variant="overline" style={styles.headerStat}>
                    J
                </ThemedText>
                <ThemedText variant="overline" style={styles.headerStat}>
                    V
                </ThemedText>
                <ThemedText variant="overline" style={styles.headerStat}>
                    E
                </ThemedText>
                <ThemedText variant="overline" style={styles.headerStat}>
                    D
                </ThemedText>
            </View>
            {ordered.map((team, index) => {
                const played = team.wins + team.draws + team.losses;
                const qualifies = index < spots;
                return (
                    <View
                        key={team.team_id}
                        style={[styles.row, index === ordered.length - 1 && styles.rowLast]}
                    >
                        {qualifies ? <View style={styles.qualifyBar} /> : <View style={styles.qualifyBarSpacer} />}
                        <ThemedText variant="body" style={styles.pos}>
                            {index + 1}
                        </ThemedText>
                        <View style={styles.teamCell}>
                            <TeamAvatar name={team.team_name ?? 'Equipe'} size={28} />
                            <ThemedText variant="section" numberOfLines={1} style={styles.teamCellName}>
                                {team.team_name ?? 'Equipe'}
                            </ThemedText>
                        </View>
                        <ThemedText variant="section" style={styles.stat}>
                            {team.points}
                        </ThemedText>
                        <ThemedText variant="body" style={styles.stat}>
                            {played}
                        </ThemedText>
                        <ThemedText variant="body" style={styles.stat}>
                            {team.wins}
                        </ThemedText>
                        <ThemedText variant="body" style={styles.stat}>
                            {team.draws}
                        </ThemedText>
                        <ThemedText variant="body" style={styles.stat}>
                            {team.losses}
                        </ThemedText>
                    </View>
                );
            })}
        </View>
    );
}

export function StandingsLegend() {
    return (
        <View style={styles.legend}>
            <View style={styles.legendDot} />
            <ThemedText variant="caption">Classificam para o mata-mata</ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.sm,
        overflow: 'hidden',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        paddingLeft: spacing.sm + 3,
    },
    headerPos: {
        width: 18,
    },
    headerTeam: {
        flex: 1,
    },
    headerStat: {
        width: 22,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
    },
    rowLast: {
        paddingBottom: spacing.sm,
    },
    qualifyBar: {
        width: 3,
        alignSelf: 'stretch',
        borderRadius: radius.pill,
        backgroundColor: colors.primary,
    },
    qualifyBarSpacer: {
        width: 3,
    },
    pos: {
        width: 18,
        color: colors.textSecondary,
    },
    teamCell: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    teamCellName: {
        flex: 1,
        fontFamily: fontFamily.bold,
    },
    stat: {
        width: 22,
        textAlign: 'center',
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.xxs,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
    },
});
