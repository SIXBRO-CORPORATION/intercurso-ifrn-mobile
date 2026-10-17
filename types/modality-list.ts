import type { ModalityGenderMode, ScoreType } from './enums';

export interface ModalitySummaryResponse {
    modality_id: string;
    name: string;
    min_members: number;
    max_members: number;
    gender_mode: ModalityGenderMode;
    min_male_members?: number | null;
    min_female_members?: number | null;
    active: boolean;
    num_periods: number;
    period_durations_minutes: number;
    score_type: ScoreType;
}
