import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { FilterChips, type FilterChipOption } from '@/components/filter-chips';
import { FinishedTrailing, LiveTrailing, MatchListRow, ScheduledTrailing } from '@/components/list-row';
import { StandingsLegend, StandingsTable } from '@/components/brackets/standings-table';
import { ThemedText } from '@/components/themed-text';
import { colors, spacing } from '@/theme';
import { formatCampusTime, formatMatchClock } from '@/utils/campus-time';
import type { BracketGroupResponse } from '@/types/bracket';
import type { MatchListItemResponse } from '@/types/match-list';

interface GroupBracketProps {
    groups: BracketGroupResponse[];
    matches: MatchListItemResponse[];
}

function matchRowProps(match: MatchListItemResponse) {
    const showScore = match.status !== 'SCHEDULED';
    const team1 = { name: match.team1?.name ?? 'A definir', score: showScore ? match.team1?.score : undefined };
    const team2 = { name: match.team2?.name ?? 'A definir', score: showScore ? match.team2?.score : undefined };

    let trailing = null;
    if (match.status === 'IN_PROGRESS') {
        trailing = <LiveTrailing minute={formatMatchClock(match.clock_seconds)} />;
    } else if (match.status === 'FINISHED') {
        trailing = <FinishedTrailing />;
    } else {
        trailing = <ScheduledTrailing time={match.scheduled_date ? formatCampusTime(match.scheduled_date) : '--:--'} />;
    }

    return { team1, team2, trailing };
}

export function GroupBracket({ groups, matches }: GroupBracketProps) {
    const sortedGroups = useMemo(
        () => [...groups].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
        [groups]
    );
    const [selectedGroupId, setSelectedGroupId] = useState<string>(sortedGroups[0]?.group_id ?? '');
    const selectedGroup = sortedGroups.find((group) => group.group_id === selectedGroupId) ?? sortedGroups[0];

    if (!selectedGroup) {
        return (
            <ThemedText variant="body" style={styles.emptyText}>
                Os grupos aparecem aqui assim que o chaveamento for sorteado.
            </ThemedText>
        );
    }

    const groupOptions: FilterChipOption<string>[] = sortedGroups.map((group) => ({
        value: group.group_id,
        label: group.name,
    }));

    const groupMatches = matches
        .filter((match) => match.group_name === selectedGroup.name)
        .sort((a, b) => (a.scheduled_date ?? '').localeCompare(b.scheduled_date ?? ''));

    return (
        <View style={styles.wrapper}>
            {sortedGroups.length > 1 ? (
                <FilterChips
                    accessibilityLabel="Selecionar grupo"
                    options={groupOptions}
                    selected={selectedGroup.group_id}
                    onSelect={setSelectedGroupId}
                />
            ) : null}

            <View style={styles.section}>
                <StandingsTable teams={selectedGroup.teams} />
                <StandingsLegend />
            </View>

            <View style={styles.section}>
                <ThemedText variant="heading">Jogos do {selectedGroup.name}</ThemedText>
                {groupMatches.length === 0 ? (
                    <ThemedText variant="body" style={styles.emptyText}>
                        Nenhum jogo deste grupo foi agendado ainda.
                    </ThemedText>
                ) : (
                    <View style={styles.matchList}>
                        {groupMatches.map((match) => {
                            const { team1, team2, trailing } = matchRowProps(match);
                            return (
                                <MatchListRow
                                    key={match.match_id}
                                    team1={team1}
                                    team2={team2}
                                    trailing={trailing}
                                    onPress={() => router.push(`/match/${match.match_id}`)}
                                />
                            );
                        })}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: spacing.md,
        gap: spacing.lg,
    },
    section: {
        gap: spacing.sm,
    },
    matchList: {
        gap: spacing.sm,
    },
    emptyText: {
        color: colors.textSecondary,
    },
});
