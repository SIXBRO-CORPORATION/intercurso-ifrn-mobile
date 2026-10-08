import { StyleSheet, View } from 'react-native';
import { Section } from '@/components/management/section';
import { ThemedText } from '@/components/themed-text';
import type { MatchPublicResponse, MatchTimelineEventResponse } from '@/types/match';
import { EventTypeLabel } from '@/types/enums';
import { spacing } from '@/theme';
import { formatMatchClock } from '@/utils/campus-time';
import { playerName, teamName } from './match-helpers';

function TimelineRow({ event, match }: { event: MatchTimelineEventResponse; match: MatchPublicResponse }) {
    const parts = [EventTypeLabel[event.event_type], teamName(match, event.team_id), playerName(match, event.player_id)]
        .filter((part): part is string => Boolean(part));

    return (
        <View style={styles.row}>
            <ThemedText variant="caption" style={styles.clock}>
                {formatMatchClock(event.clock_seconds)}
            </ThemedText>
            <ThemedText variant="subhead" style={styles.text}>
                {parts.join(' · ')}
            </ThemedText>
        </View>
    );
}

export function MatchTimeline({ match }: { match: MatchPublicResponse }) {
    return (
        <Section title="Linha do tempo">
            {match.timeline.length > 0 ? (
                match.timeline.map((event) => <TimelineRow key={event.event_id} event={event} match={match} />)
            ) : (
                <ThemedText variant="subhead">Nenhum evento registrado ainda.</ThemedText>
            )}
        </Section>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: spacing.sm,
        minHeight: 28,
        alignItems: 'flex-start',
    },
    clock: {
        width: 48,
        fontVariant: ['tabular-nums'],
    },
    text: {
        flex: 1,
    },
});
