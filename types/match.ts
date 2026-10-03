import type { MatchCategory, MatchStatus, MatchType } from './enums';

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
