import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, type IconName } from '@/components/icon';
import { ListRow, ListRowIcon } from '@/components/list-row';
import { Segmented } from '@/components/form/segmented';
import { TeamAvatar } from '@/components/teams/team-avatar';
import { ThemedText } from '@/components/themed-text';
import type { MatchPublicResponse, MatchTimelineEventResponse } from '@/types/match';
import { EventTypeLabel, MatchCategoryLabel, type EventType } from '@/types/enums';
import { colors, radius, spacing } from '@/theme';
import {
    matchCardCounts,
    penaltyShootoutKicks,
    playerName,
    teamName,
    topScorers,
    type PenaltyShootoutKick,
} from './match-helpers';

type LiveTab = 'lances' | 'estatisticas';

interface EventPresentation {
    icon: IconName;
    background: string;
    foreground: string;
}

const EVENT_PRESENTATION: Record<EventType, EventPresentation> = {
    GOAL: { icon: 'ball', background: colors.primary, foreground: colors.surface },
    POINT: { icon: 'ball', background: colors.primary, foreground: colors.surface },
    PENALTY_GOAL: { icon: 'ball', background: colors.primary, foreground: colors.surface },
    PENALTY_MISS: { icon: 'close', background: colors.dangerSoft, foreground: colors.danger },
    CARD_YELLOW: { icon: 'card', background: colors.warningSoft, foreground: colors.warningText },
    CARD_RED: { icon: 'card', background: colors.danger, foreground: colors.surface },
    EXPULSION: { icon: 'flag', background: colors.danger, foreground: colors.surface },
    MATCH_STARTED: { icon: 'play', background: colors.field, foreground: colors.textSecondary },
    MATCH_END: { icon: 'flag', background: colors.field, foreground: colors.textSecondary },
    PERIOD_START: { icon: 'clock', background: colors.field, foreground: colors.textSecondary },
    PERIOD_END: { icon: 'clock', background: colors.field, foreground: colors.textSecondary },
    SET_END: { icon: 'trophy', background: colors.field, foreground: colors.textSecondary },
};

function eventMinuteLabel(clockSeconds: number): string {
    return `${Math.floor(Math.max(0, clockSeconds) / 60)}'`;
}

function SectionTitle({ children }: { children: string }) {
    return (
        <ThemedText variant="heading" style={styles.sectionTitle}>
            {children}
        </ThemedText>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <ListRow
            title={label}
            emphasis="regular"
            trailing={
                <ThemedText variant="body" style={styles.detailValue}>
                    {value}
                </ThemedText>
            }
        />
    );
}

function SetsList({ match }: { match: MatchPublicResponse }) {
    if (match.sets.length === 0) return null;

    return (
        <View style={styles.rows}>
            {match.sets.map((set) => (
                <DetailRow
                    key={set.set_number}
                    label={`Set ${set.set_number}`}
                    value={`${set.team1_points} × ${set.team2_points}`}
                />
            ))}
        </View>
    );
}

function MatchDetailsList({ match }: { match: MatchPublicResponse }) {
    return (
        <View style={styles.rows}>
            <DetailRow label="Categoria" value={MatchCategoryLabel[match.match_category]} />
            <SetsList match={match} />
        </View>
    );
}

function TimelineRow({ event, match }: { event: MatchTimelineEventResponse; match: MatchPublicResponse }) {
    const presentation = EVENT_PRESENTATION[event.event_type];
    const title = [EventTypeLabel[event.event_type], playerName(match, event.player_id)]
        .filter((part): part is string => Boolean(part))
        .join(' · ');

    return (
        <ListRow
            leading={
                <ListRowIcon background={presentation.background} size={44}>
                    <Icon name={presentation.icon} size={20} color={presentation.foreground} />
                </ListRowIcon>
            }
            title={title}
            subtitle={teamName(match, event.team_id)}
            trailing={
                <ThemedText variant="section" style={styles.eventClock}>
                    {eventMinuteLabel(event.clock_seconds)}
                </ThemedText>
            }
        />
    );
}

function LiveTimeline({ match }: { match: MatchPublicResponse }) {
    const [tab, setTab] = useState<LiveTab>('lances');

    return (
        <View style={styles.liveContainer}>
            <Segmented
                options={[
                    { label: 'Lances', value: 'lances' as LiveTab },
                    { label: 'Estatísticas', value: 'estatisticas' as LiveTab },
                ]}
                value={tab}
                onChange={setTab}
            />

            {tab === 'lances' ? (
                match.timeline.length > 0 ? (
                    <View style={styles.rows}>
                        {match.timeline.map((event) => (
                            <TimelineRow key={event.event_id} event={event} match={match} />
                        ))}
                    </View>
                ) : (
                    <ThemedText variant="body" style={styles.emptyText}>
                        Nenhum lance registrado ainda.
                    </ThemedText>
                )
            ) : (
                <MatchDetailsList match={match} />
            )}
        </View>
    );
}

function PenaltyKickDot({ kick }: { kick: PenaltyShootoutKick }) {
    const made = kick.result === 'GOAL';
    return (
        <View
            style={[styles.kickDot, { backgroundColor: made ? colors.primary : colors.danger }]}
            accessibilityLabel={made ? 'Convertido' : 'Perdido'}
        >
            <Icon name={made ? 'check' : 'close'} size={12} color={colors.surface} />
        </View>
    );
}

function PenaltyShootoutRow({
    teamLabel,
    kicks,
    total,
}: {
    teamLabel: string;
    kicks: PenaltyShootoutKick[];
    total: number;
}) {
    return (
        <View style={styles.penaltyShootoutRow}>
            <ThemedText variant="section" numberOfLines={1} style={styles.penaltyShootoutName}>
                {teamLabel}
            </ThemedText>
            <View style={styles.penaltyShootoutDots}>
                {kicks.map((kick, index) => (
                    <PenaltyKickDot key={index} kick={kick} />
                ))}
            </View>
            <ThemedText variant="heading">{total}</ThemedText>
        </View>
    );
}

function PenaltyShootoutSection({ match }: { match: MatchPublicResponse }) {
    if (!match.penalty_result) return null;

    const kicks = penaltyShootoutKicks(match);

    return (
        <View style={styles.section}>
            <SectionTitle>Disputa de pênaltis</SectionTitle>
            <View style={styles.penaltyCard}>
                <PenaltyShootoutRow
                    teamLabel={match.team1.name}
                    kicks={kicks.team1}
                    total={match.penalty_result.team1_penalties}
                />
                <PenaltyShootoutRow
                    teamLabel={match.team2.name}
                    kicks={kicks.team2}
                    total={match.penalty_result.team2_penalties}
                />
            </View>
        </View>
    );
}

function TopScorersSection({ match }: { match: MatchPublicResponse }) {
    const scorers = topScorers(match);
    if (scorers.length === 0) return null;

    return (
        <View style={styles.section}>
            <SectionTitle>Artilheiros</SectionTitle>
            <View style={styles.rows}>
                {scorers.map((scorer) => (
                    <ListRow
                        key={scorer.playerId}
                        leading={<TeamAvatar name={scorer.name} size={44} />}
                        title={scorer.name}
                        subtitle={scorer.teamName}
                        trailing={
                            <View style={styles.scorerTrailing}>
                                <Icon name="ball" size={16} color={colors.primaryDark} />
                                <ThemedText variant="section">x{scorer.goals}</ThemedText>
                            </View>
                        }
                    />
                ))}
            </View>
        </View>
    );
}

function CardsSummarySection({ match }: { match: MatchPublicResponse }) {
    const counts = matchCardCounts(match);

    return (
        <View style={styles.cardsRow}>
            <ThemedText variant="section">Cartões</ThemedText>
            <View style={styles.cardsChips}>
                <View style={[styles.chip, styles.chipWarning]}>
                    <ThemedText variant="label" style={styles.chipWarningText}>
                        {counts.yellow} amarelo{counts.yellow === 1 ? '' : 's'}
                    </ThemedText>
                </View>
                <View style={[styles.chip, styles.chipNeutral]}>
                    <ThemedText variant="label" style={styles.chipNeutralText}>
                        {counts.red} vermelho{counts.red === 1 ? '' : 's'}
                    </ThemedText>
                </View>
            </View>
        </View>
    );
}

function FinishedSummary({ match }: { match: MatchPublicResponse }) {
    return (
        <View style={styles.finishedContainer}>
            <PenaltyShootoutSection match={match} />
            <TopScorersSection match={match} />
            <CardsSummarySection match={match} />
            {match.sets.length > 0 ? (
                <View style={styles.section}>
                    <SectionTitle>Sets</SectionTitle>
                    <SetsList match={match} />
                </View>
            ) : null}
        </View>
    );
}

export function MatchTimeline({ match }: { match: MatchPublicResponse }) {
    if (match.status === 'FINISHED') {
        return <FinishedSummary match={match} />;
    }

    if (match.status === 'IN_PROGRESS') {
        return <LiveTimeline match={match} />;
    }

    return (
        <View style={styles.section}>
            <SectionTitle>Detalhes</SectionTitle>
            <MatchDetailsList match={match} />
        </View>
    );
}

const styles = StyleSheet.create({
    liveContainer: {
        gap: spacing.md,
    },
    section: {
        gap: spacing.sm,
    },
    sectionTitle: {
        marginLeft: spacing.xxs,
    },
    rows: {
        gap: spacing.xs,
    },
    emptyText: {
        color: colors.textSecondary,
        textAlign: 'center',
        paddingVertical: spacing.lg,
    },
    detailValue: {
        color: colors.textSecondary,
    },
    eventClock: {
        fontVariant: ['tabular-nums'],
    },
    penaltyCard: {
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    penaltyShootoutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        minHeight: 32,
    },
    penaltyShootoutName: {
        width: 88,
    },
    penaltyShootoutDots: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: spacing.xxs,
    },
    kickDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scorerTrailing: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
    },
    finishedContainer: {
        gap: spacing.lg,
    },
    cardsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: spacing.sm,
    },
    cardsChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    chip: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        borderCurve: 'continuous',
    },
    chipWarning: {
        backgroundColor: colors.warningSoft,
    },
    chipWarningText: {
        color: colors.warningText,
    },
    chipNeutral: {
        backgroundColor: colors.field,
    },
    chipNeutralText: {
        color: colors.textSecondary,
    },
});
