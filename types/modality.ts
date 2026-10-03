import type { ScoreType } from './enums';


export interface ModalityCreateRequest {
    name: string;
    min_members: number;
    max_members: number;

    num_periods: number;
    period_durations_minutes: number;
    score_type: ScoreType;
    has_third_place_match?: boolean;
    metadata?: unknown;

    points_per_set?: number;
    final_set_points?: number;
    sets_to_win?: number;
}

export interface ModalityConfiguration {
    num_periods: number;
    period_durations_minutes: number;
    score_type: ScoreType;
    has_third_place_match: boolean;
    metadata?: unknown;
    points_per_set?: number;
    final_set_points?: number;
    sets_to_win?: number;
}

export interface ModalityCreateResponse {
    modality_id: string;
    name: string;
    min_members: number;
    max_members: number;
    active: boolean;
    configuration?: ModalityConfiguration;
    message: string;
}