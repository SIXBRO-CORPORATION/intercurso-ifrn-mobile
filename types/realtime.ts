import type { MatchPublicResponse } from './match';

export type LiveChannelType = 'match' | 'season';

export interface LiveTicketRequest {
    channel_type: LiveChannelType;
    channel_id: string;
}

export interface LiveTicketResponse {
    ticket: string;
    expires_in_seconds: number;
}

export type RealtimeMatchEventType =
    | 'match_started'
    | 'score_update'
    | 'goal_scored'
    | 'card_issued'
    | 'clock_update'
    | 'period_ended'
    | 'period_started'
    | 'set_finished'
    | 'match_finished'
    | 'event_deleted';

export interface RealtimeMatchEventPayload {
    match_id: string;
    event: RealtimeMatchEventType;
    match: MatchPublicResponse | null;
}

export type RealtimeConnectionStatus =
    | 'idle'
    | 'connecting'
    | 'open'
    | 'reconnecting'
    | 'closed'
    | 'error';
