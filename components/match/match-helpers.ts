import { useEffect, useState } from 'react';
import type { MatchPublicResponse } from '@/types/match';

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
