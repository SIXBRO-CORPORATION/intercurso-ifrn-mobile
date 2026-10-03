import type { SeasonStatus } from './enums';

export type IsoDateString = string;

export type SeasonAction =
    | 'edit_registration_dates'
    | 'postpone_opening'
    | 'edit_registration_end_date'
    | 'close_registration_early'
    | 'reopen_registration';

export interface SeasonListFilters {
    status?: SeasonStatus;
    year?: number;
}

export interface SeasonCreateRequest {
    name: string;
    year: number;
    modality_ids: string[];
    registration_start_date?: IsoDateString;
    registration_end_date: IsoDateString;
    open_immediately?: boolean;
    rules_document?: string;
}

export interface SeasonCreateResponse {
    season_id: string;
    name: string;
    year: number;
    status: SeasonStatus;
    active: boolean;
    registration_start_date?: IsoDateString | null;
    registration_end_date?: IsoDateString | null;
    modality_ids: string[];
    message: string;
}

export interface SeasonSummary {
    season_id: string;
    name: string;
    year: number;
    status: SeasonStatus;
    active: boolean;
    registration_start_date?: IsoDateString | null;
    registration_end_date?: IsoDateString | null;
}

export interface SeasonDetails extends SeasonSummary {
    modality_ids: string[];
    registration_opened_at?: IsoDateString | null;
    registration_closed_at?: IsoDateString | null;
    total_teams_created: number;
    total_teams_submitted: number;
    total_teams_approved: number;
    available_actions: SeasonAction[];
}

export interface SeasonStatusResponse {
    season_id: string;
    name: string;
    status: SeasonStatus;
    active: boolean;
    registration_start_date?: IsoDateString | null;
    registration_end_date?: IsoDateString | null;
    registration_closed_at?: IsoDateString | null;
    finished_at?: IsoDateString | null;
    message: string;
}

export interface SeasonEditDatesRequest {
    new_registration_start_date?: IsoDateString;
    new_registration_end_date?: IsoDateString;
    reason?: string;
}

export interface SeasonReopenRequest {
    new_registration_end_date: IsoDateString;
}

export interface SeasonFinishRequest {
    confirmation_name: string;
}
