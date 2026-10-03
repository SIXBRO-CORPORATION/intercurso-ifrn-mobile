import type { BracketStatus, ModalityFormat } from './enums';

export type BracketConfiguration = Record<string, unknown>;

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
