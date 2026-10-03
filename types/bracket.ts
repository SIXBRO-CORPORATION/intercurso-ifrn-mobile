import type { BracketStatus, MatchCategory, MatchStatus, MatchType, ModalityFormat } from './enums';
import type { IsoDateString } from './season';

export type BracketConfiguration = Record<string, unknown>;

export type BracketAction = 'resort';

export interface BracketPreviewParams {
    modality_id: string;
    format: ModalityFormat;
}

export interface BracketConfigSuggestionResponse {
    modality_id: string;
    format: ModalityFormat;
    team_count: number;
    byes_estimated: number;
    suggested_configuration: BracketConfiguration;
}

export interface BracketCreateRequest {
    modality_id: string;
    format: ModalityFormat;
    configuration?: BracketConfiguration | null;
}

export interface BracketResponse {
    bracket_id: string;
    season_id: string;
    modality_id: string;
    format: ModalityFormat;
    configuration: BracketConfiguration;
    status: BracketStatus;
    teams_count: number;
    groups_created: number;
    matches_created: number;
    byes_created: number;
    season_transitioned_to_in_progress: boolean;
}

export interface BracketDeleteMatchResponse {
    match_id: string;
}

export interface BracketSummaryResponse {
    bracket_id: string;
    season_id: string;
    modality_id: string;
    modality_name?: string | null;
    format: ModalityFormat;
    status: BracketStatus;
    total_matches: number;
    started_matches: number;
    finished_matches: number;
    available_actions: BracketAction[];
}

export interface BracketMatchResponse {
    match_id: string;
    bracket_id: string;
    group_name?: string | null;
    team1_id?: string | null;
    team1_name?: string | null;
    team2_id?: string | null;
    team2_name?: string | null;
    scheduled_date?: IsoDateString | null;
    match_type: MatchType;
    match_category: MatchCategory;
    status: MatchStatus;
}

export interface BracketGroupTeamResponse {
    team_id: string;
    team_name?: string | null;
    points: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    goals_difference: number;
}

export interface BracketGroupResponse {
    group_id: string;
    name: string;
    display_order?: number | null;
    teams: BracketGroupTeamResponse[];
}

export interface BracketDetailResponse extends BracketSummaryResponse {
    configuration: BracketConfiguration;
    groups: BracketGroupResponse[];
    matches: BracketMatchResponse[];
}
