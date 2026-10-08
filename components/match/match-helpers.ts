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

function syncClockAnchor(matchId: string, seconds: number, running: boolean): ClockAnchor {
    const current = clockAnchors.get(matchId);
    
    if (!current || current.seconds !== seconds || current.running !== running) {
        const next: ClockAnchor = { seconds, running, syncedAt: Date.now() };
        clockAnchors.set(matchId, next);
        return next;
    }

    return current;
}

export function useLiveClock(matchId: string, seconds: number, running: boolean): number {
    const anchor = syncClockAnchor(matchId, seconds, running);
    const [, forceTick] = useState(0);

    useEffect(() => {
        if (!running) return;
        const interval = setInterval(() => forceTick((tick) => tick + 1), 1000);
        return () => clearInterval(interval);
    }, [running, matchId]);

    if (!anchor.running) return anchor.seconds;
    return anchor.seconds + Math.floor((Date.now() - anchor.syncedAt) / 1000);
}
