import type { CardType, EventType, MatchCategory, MatchStatus, MatchType, PenaltyKickResult } from './enums';
import type { IsoDateString } from './season';

export interface MatchResponse {
    match_id: string;
    bracket_id: string;
    team1_id?: string | null;
    team2_id?: string | null;
    scheduled_date?: string | null;
    status: MatchStatus;
    match_type: MatchType;
    match_category: MatchCategory;
}

export interface MatchUpdateRequest {
    scheduled_date?: string | null;
    team1_id?: string | null;
    team2_id?: string | null;
}

export interface MatchGoalRequest {
    team_id: string;
    player_id: string;
}

export interface MatchCardRequest {
    team_id: string;
    player_id: string;
    card_type: CardType;
}

export interface MatchPenaltyKickRequest {
    team_id: string;
    result: PenaltyKickResult;
    player_id?: string | null;
}

export interface MatchTeamResponse {
    team_id: string;
    name: string;
    photo?: string | null;
    score: number;
    sets_won?: number | null;
    penalty_score?: number | null;
}

export interface MatchSetResponse {
    set_number: number;
    team1_points: number;
    team2_points: number;
    winner_team_id: string;
}

export interface MatchPlayerResponse {
    user_id: string;
    name: string;
    matricula: string;
    role: string;
}

export interface MatchModalityConfigurationResponse {
    num_periods?: number | null;
    period_duration_minutes?: number | null;
    score_type?: string | null;
    has_third_place_match?: boolean | null;
    points_per_set?: number | null;
    final_set_points?: number | null;
    sets_to_win?: number | null;
}

export interface MatchTimelineEventResponse {
    event_id: string;
    event_type: EventType;
    clock_seconds: number;
    team_id?: string | null;
    player_id?: string | null;
    created_at?: IsoDateString | null;
    metadata?: Record<string, unknown> | null;
}

export interface MatchPenaltyResult {
    team1_penalties: number;
    team2_penalties: number;
    winner_id?: string | null;
}

export interface MatchManagementResponse {
    match_id: string;
    bracket_id: string;
    modality_id?: string | null;
    modality_name?: string | null;
    match_type: MatchType;
    match_category: MatchCategory;
    status: MatchStatus;
    scheduled_date?: IsoDateString | null;
    started_at?: IsoDateString | null;
    finished_at?: IsoDateString | null;
    monitor_id?: string | null;
    winner_id?: string | null;
    penalty_result?: MatchPenaltyResult | null;

    team1: MatchTeamResponse;
    team2: MatchTeamResponse;
    team1_players: MatchPlayerResponse[];
    team2_players: MatchPlayerResponse[];

    clock_seconds: number;
    clock_running: boolean;
    current_period: number;

    penalty_shootout_active: boolean;

    modality_configuration?: MatchModalityConfigurationResponse | null;

    timeline: MatchTimelineEventResponse[];

    sets: MatchSetResponse[];

    metadata?: Record<string, unknown> | null;
    match_point_reached?: boolean | null;
    reactivated_player_id?: string | null;
    correction_alert?: Record<string, unknown> | null;
}
