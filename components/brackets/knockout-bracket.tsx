import { Fragment, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
    BRACKET_CARD_HEIGHT,
    BRACKET_CARD_WIDTH,
    BracketMatchCard,
    type BracketCardTeam,
} from '@/components/brackets/bracket-match-card';
import { ThemedText } from '@/components/themed-text';
import { colors, spacing } from '@/theme';
import type { BracketMatchResponse } from '@/types/bracket';

export interface BracketMatchScoreInfo {
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED';
    team1Score?: number;
    team2Score?: number;
}

type KnockoutBracketProps = {
    matches: BracketMatchResponse[];
    scoreByMatchId: Map<string, BracketMatchScoreInfo>;
};

interface Round {
    key: string;
    label: string;
    matches: BracketMatchResponse[];
}

const ROUND0_GAP = spacing.lg;
const ROUND0_SLOT = BRACKET_CARD_HEIGHT + ROUND0_GAP;
const CONNECTOR_WIDTH = spacing.xl;

function regularRoundLabel(matches: BracketMatchResponse[], hasLaterRounds: boolean): string {
    const explicitLabel = matches.find((match) => !!match.round_name)?.round_name;
    if (explicitLabel) return explicitLabel;

    if (!hasLaterRounds) return 'Mata-mata';
    const matchCount = matches.length;
    if (matchCount <= 2) return 'Semifinal';
    if (matchCount <= 4) return 'Quartas de final';
    if (matchCount <= 8) return 'Oitavas de final';
    return 'Primeira fase';
}

function buildRounds(matches: BracketMatchResponse[]): { rounds: Round[]; thirdPlace: BracketMatchResponse | null } {
    const regular = matches.filter((match) => match.match_type === 'REGULAR');
    const semifinal = matches.filter((match) => match.match_type === 'SEMIFINAL');
    const final = matches.filter((match) => match.match_type === 'FINAL');
    const thirdPlace = matches.find((match) => match.match_type === 'THIRD_PLACE') ?? null;

    const rounds: Round[] = [];
    if (regular.length > 0) {
        rounds.push({
            key: 'regular',
            label: regularRoundLabel(regular, semifinal.length > 0 || final.length > 0),
            matches: regular,
        });
    }
    if (semifinal.length > 0) {
        rounds.push({ key: 'semifinal', label: 'Semifinal', matches: semifinal });
    }
    if (final.length > 0) {
        rounds.push({ key: 'final', label: 'Final', matches: final });
    }

    return { rounds, thirdPlace };
}

function cardTeams(match: BracketMatchResponse, info: BracketMatchScoreInfo | undefined): {
    team1: BracketCardTeam;
    team2: BracketCardTeam;
    live: boolean;
} {
    return {
        team1: { name: match.team1_name ?? null, score: info?.team1Score },
        team2: { name: match.team2_name ?? null, score: info?.team2Score },
        live: info?.status === 'IN_PROGRESS',
    };
}

function centersFor(count: number, slot: number): number[] {
    return Array.from({ length: count }, (_, i) => i * slot + slot / 2);
}

function RoundConnector({ fromCenters, toCenters, height }: { fromCenters: number[]; toCenters: number[]; height: number }) {
    const halfWidth = CONNECTOR_WIDTH / 2;

    return (
        <View style={{ width: CONNECTOR_WIDTH, height }}>
            {fromCenters.map((y, index) => (
                <View key={`stub-${index}`} style={[styles.hLine, { top: y, left: 0, width: halfWidth }]} />
            ))}
            {toCenters.map((y, index) => (
                <Fragment key={`pair-${index}`}>
                    <View
                        style={[
                            styles.vLine,
                            {
                                left: halfWidth,
                                top: fromCenters[index * 2],
                                height: fromCenters[index * 2 + 1] - fromCenters[index * 2],
                            },
                        ]}
                    />
                    <View style={[styles.hLine, { top: y, left: halfWidth, width: halfWidth }]} />
                </Fragment>
            ))}
        </View>
    );
}

export function KnockoutBracket({ matches, scoreByMatchId }: KnockoutBracketProps) {
    const { rounds, thirdPlace } = useMemo(() => buildRounds(matches), [matches]);

    if (rounds.length === 0) {
        return (
            <ThemedText variant="body" style={styles.emptyText}>
                As partidas do mata-mata aparecem aqui assim que o chaveamento for sorteado.
            </ThemedText>
        );
    }

    const containerHeight = rounds[0].matches.length * ROUND0_SLOT;

    return (
        <View style={styles.wrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {rounds.map((round, roundIndex) => {
                    const slot = ROUND0_SLOT * 2 ** roundIndex;
                    const centers = centersFor(round.matches.length, slot);
                    const nextRound = rounds[roundIndex + 1];
                    const canConnect = !!nextRound && round.matches.length === nextRound.matches.length * 2;

                    return (
                        <Fragment key={round.key}>
                            <View style={styles.column}>
                                <ThemedText variant="overline" style={styles.columnLabel}>
                                    {round.label}
                                </ThemedText>
                                <View style={{ height: containerHeight, width: BRACKET_CARD_WIDTH }}>
                                    {round.matches.map((match, matchIndex) => {
                                        const info = scoreByMatchId.get(match.match_id);
                                        const { team1, team2, live } = cardTeams(match, info);
                                        return (
                                            <View
                                                key={match.match_id}
                                                style={{
                                                    position: 'absolute',
                                                    top: centers[matchIndex] - BRACKET_CARD_HEIGHT / 2,
                                                    left: 0,
                                                }}
                                            >
                                                <BracketMatchCard
                                                    team1={team1}
                                                    team2={team2}
                                                    live={live}
                                                    onPress={() => router.push(`/match/${match.match_id}`)}
                                                />
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                            {roundIndex < rounds.length - 1 ? (
                                <View style={[styles.connectorSlot, { marginTop: 30 }]}>
                                    {canConnect ? (
                                        <RoundConnector
                                            fromCenters={centers}
                                            toCenters={centersFor(nextRound.matches.length, slot * 2)}
                                            height={containerHeight}
                                        />
                                    ) : null}
                                </View>
                            ) : null}
                        </Fragment>
                    );
                })}
            </ScrollView>
            {rounds.length > 1 ? (
                <ThemedText variant="caption" style={styles.hint}>
                    Deslize para ver as próximas fases
                </ThemedText>
            ) : null}
            {thirdPlace ? (
                <View style={styles.thirdPlace}>
                    <ThemedText variant="section" style={styles.thirdPlaceTitle}>
                        Disputa de 3º lugar
                    </ThemedText>
                    {(() => {
                        const info = scoreByMatchId.get(thirdPlace.match_id);
                        const { team1, team2, live } = cardTeams(thirdPlace, info);
                        return (
                            <BracketMatchCard
                                team1={team1}
                                team2={team2}
                                live={live}
                                onPress={() => router.push(`/match/${thirdPlace.match_id}`)}
                            />
                        );
                    })()}
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        gap: spacing.sm,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingTop: 30,
    },
    column: {
        gap: spacing.sm,
    },
    columnLabel: {
        textAlign: 'center',
    },
    connectorSlot: {
        width: CONNECTOR_WIDTH,
    },
    hLine: {
        position: 'absolute',
        height: 2,
        backgroundColor: colors.border,
    },
    vLine: {
        position: 'absolute',
        width: 2,
        backgroundColor: colors.border,
    },
    hint: {
        textAlign: 'center',
        color: colors.textMuted,
    },
    emptyText: {
        color: colors.textSecondary,
        paddingHorizontal: spacing.md,
    },
    thirdPlace: {
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    thirdPlaceTitle: {
        color: colors.ink,
    },
});
