import type { MatchStatus, MatchCategory, MatchType } from './enums';
import type { MatchTeamResponse } from './match';


export interface MatchListItemResponse {
    match_id: string;
    bracket_id: string;
    modality_id?: string | null;
    modality_name?: string | null;
    group_name?: string | null;
    match_type: MatchType;
    match_category: MatchCategory;
    status: MatchStatus;
    scheduled_date?: string | null;
    team1?: MatchTeamResponse | null;
    team2?: MatchTeamResponse | null;
    winner_id?: string | null;
    clock_seconds: number;
    clock_running: boolean;
    current_period: number;
}

export interface MatchListResponse {
    items: MatchListItemResponse[];
    total: number;
    page: number;
    size: number;
}

export interface MatchListFilters {
    seasonId: string;
    modalityId?: string;
    status?: MatchStatus;
    dateFrom?: string;
    dateTo?: string;
}
