import type { ModalityGenderMode, ScoreType } from './enums';


export interface ModalityCreateRequest {
    name: string;
    min_members: number;
    max_members: number;
    gender_mode: ModalityGenderMode;
    min_male_members?: number;
    min_female_members?: number;

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
    gender_mode: ModalityGenderMode;
    min_male_members?: number | null;
    min_female_members?: number | null;
    active: boolean;
    configuration?: ModalityConfiguration;
    message: string;
}