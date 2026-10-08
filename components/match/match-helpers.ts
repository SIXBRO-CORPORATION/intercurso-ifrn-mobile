import { useEffect, useRef, useState } from 'react';
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

export function useLiveClock(seconds: number, running: boolean): number {
    const anchorRef = useRef({ seconds, timestamp: Date.now() });
    const [, forceTick] = useState(0);

    useEffect(() => {
        anchorRef.current = { seconds, timestamp: Date.now() };
        forceTick((tick) => tick + 1);
    }, [seconds, running]);

    useEffect(() => {
        if (!running) return;
        const interval = setInterval(() => forceTick((tick) => tick + 1), 1000);
        return () => clearInterval(interval);
    }, [running]);

    if (!running) return anchorRef.current.seconds;
    return anchorRef.current.seconds + Math.floor((Date.now() - anchorRef.current.timestamp) / 1000);
}
