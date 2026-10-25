import { useEffect, useState } from 'react';
import type { MatchPublicResponse } from '@/types/match';
import { EventTypeLabel } from '@/types/enums';

export function teamName(match: MatchPublicResponse, teamId?: string | null): string | undefined {
    if (!teamId) return undefined;
    if (match.team1.team_id === teamId) return match.team1.name;
    if (match.team2.team_id === teamId) return match.team2.name;
    return undefined;
}

export function playerName(match: MatchPublicResponse, playerId?: string | null): string | undefined {
    if (!playerId) return undefined;
    return [...match.team1_players, ...match.team2_players].find((player) => player.user_id === playerId)?.name;
}

export function expelledPlayerIds(match: MatchPublicResponse): Set<string> {
    const ids = new Set<string>();
    for (const event of match.timeline) {
        if (event.event_type === 'EXPULSION' && event.player_id) {
            ids.add(event.player_id);
        }
    }
    return ids;
}

export function cautionedPlayerIds(match: MatchPublicResponse): Set<string> {
    const expelled = expelledPlayerIds(match);
    const ids = new Set<string>();
    for (const event of match.timeline) {
        if (event.event_type === 'CARD_YELLOW' && event.player_id && !expelled.has(event.player_id)) {
            ids.add(event.player_id);
        }
    }
    return ids;
}

export function clockLabel(totalSeconds: number): string {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${minutes}'${seconds < 10 ? `0${seconds}` : seconds}`;
}

const NON_CORRECTABLE_EVENT_TYPES = new Set<MatchPublicResponse['timeline'][number]['event_type']>([
    'MATCH_STARTED',
    'MATCH_END',
    'PERIOD_START',
    'PERIOD_END',
]);

export function isEventCorrectable(eventType: MatchPublicResponse['timeline'][number]['event_type']): boolean {
    return !NON_CORRECTABLE_EVENT_TYPES.has(eventType);
}

export function eventDeletionPreview(
    match: MatchPublicResponse,
    event: MatchPublicResponse['timeline'][number]
): { title: string; description: string } {
    const who = playerName(match, event.player_id);
    const time = clockLabel(event.clock_seconds);
    const base = `${EventTypeLabel[event.event_type]}${who ? ` de ${who}` : ''} aos ${time}`;

    const isScoreEvent = event.event_type === 'GOAL' || event.event_type === 'POINT';
    if (isScoreEvent && event.team_id) {
        const nextTeam1 = event.team_id === match.team1.team_id ? match.team1.score - 1 : match.team1.score;
        const nextTeam2 = event.team_id === match.team2.team_id ? match.team2.score - 1 : match.team2.score;
        return {
            title: 'Desfazer evento?',
            description: `Desfazer ${base}? O placar será atualizado para ${Math.max(0, nextTeam1)} × ${Math.max(0, nextTeam2)}.`,
        };
    }

    return { title: 'Desfazer evento?', description: `Desfazer ${base}?` };
}


export interface PenaltyShootoutKick {
    result: 'GOAL' | 'MISS';
    playerName?: string;
}

export interface PenaltyShootoutSummary {
    team1: PenaltyShootoutKick[];
    team2: PenaltyShootoutKick[];
}

export function penaltyShootoutKicks(match: MatchPublicResponse): PenaltyShootoutSummary {
    const toKick = (kick: { player_id?: string | null; result: PenaltyShootoutKick['result'] }): PenaltyShootoutKick => ({
        result: kick.result,
        playerName: playerName(match, kick.player_id),
    });

    return {
        team1: match.penalty_shootout.team1.map(toKick),
        team2: match.penalty_shootout.team2.map(toKick),
    };
}

export interface TopScorer {
    playerId: string;
    name: string;
    teamName?: string;
    goals: number;
}

export function topScorers(match: MatchPublicResponse): TopScorer[] {
    return match.top_scorers.map((scorer) => ({
        playerId: scorer.player_id,
        name: scorer.name,
        teamName: teamName(match, scorer.team_id),
        goals: scorer.goals,
    }));
}

export interface MatchCardCounts {
    yellow: number;
    red: number;
}

export function matchCardCounts(match: MatchPublicResponse): MatchCardCounts {
    return { yellow: match.card_summary.yellow, red: match.card_summary.red };
}

interface ClockAnchor {
    seconds: number;
    running: boolean;
    syncedAt: number;
}

const clockAnchors = new Map<string, ClockAnchor>();

function computeClockAnchor(
    matchId: string,
    seconds: number,
    running: boolean,
    asOf: number
): ClockAnchor {
    const current = clockAnchors.get(matchId);

    if (current && current.seconds === seconds && current.running === running) {
        return current;
    }

    if (current && asOf < current.syncedAt) {
        return current;
    }

    const next: ClockAnchor = { seconds, running, syncedAt: asOf };
    clockAnchors.set(matchId, next);
    return next;
}

export function useLiveClock(matchId: string, seconds: number, running: boolean, asOf: number): number {

    const [anchor, setAnchor] = useState<ClockAnchor>(() =>
        computeClockAnchor(matchId, seconds, running, asOf)
    );

    useEffect(() => {
        setAnchor(computeClockAnchor(matchId, seconds, running, asOf));
    }, [matchId, seconds, running, asOf]);

    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!anchor.running) return;
        setNow(Date.now());
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [anchor]);

    if (!anchor.running) return anchor.seconds;
    return anchor.seconds + Math.max(0, Math.floor((now - anchor.syncedAt) / 1000));
}
