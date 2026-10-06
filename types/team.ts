import type { DonationStatus, Gender, ModalityGenderMode, TeamMemberRole, TeamStatus } from './enums';

export interface TeamListFilters {
    status?: TeamStatus;
    season_id?: string;
}

export interface TeamPhotoFile {
    uri: string;
    name: string;
    type: string;
}

export interface TeamRegisterRequest {
    name: string;
    photo?: TeamPhotoFile | null;
    modality_id: string;
}

export interface TeamRegisterResponse {
    team_id: string;
    name: string;
    modality_id: string;
    status: TeamStatus;
    photo?: string | null;
    invite_token?: string | null;
    owner_id: string;
    message: string;
}

export interface TeamSummary {
    team_id: string;
    name: string;
    season_id?: string | null;
    modality_id: string;
    modality_name?: string | null;
    status: TeamStatus;
    owner_id?: string | null;
    owner_name?: string | null;
    members_count: number;
    donations_confirmed: number;
    donations_total: number;
    submmited_at?: string | null;
}

export interface TeamMember {
    user_id: string;
    name: string;
    matricula: string;
    role: TeamMemberRole;
    donation_status: DonationStatus;
    gender?: Gender | null;
}

export interface TeamModalityRules {
    min_members?: number | null;
    max_members?: number | null;
    gender_mode?: ModalityGenderMode | null;
    min_male_members?: number | null;
    min_female_members?: number | null;
}

export interface TeamDetails extends TeamModalityRules {
    team_id: string;
    name: string;
    season_id?: string | null;
    modality_id: string;
    modality_name?: string | null;
    photo?: string | null;
    status: TeamStatus;
    owner_id?: string | null;
    owner_name?: string | null;
    captain_id?: string | null;
    captain_name?: string | null;
    token_active: boolean;
    invite_token?: string | null;
    submmited_at?: string | null;
    approved_at?: string | null;
    rejected_at?: string | null;
    rejection_reason?: string | null;
    members: TeamMember[];
    donations_confirmed: number;
    donations_total: number;
}

export interface TeamInvitePreview extends TeamModalityRules {
    team_id: string;
    name: string;
    modality_id: string;
    modality_name?: string | null;
    photo?: string | null;
    members_count: number;
    captain_name?: string | null;
    owner_name?: string | null;
}

export interface TeamJoinResponse {
    team_id: string;
    team_name: string;
    role: TeamMemberRole;
    donation_status: DonationStatus;
    joined_at: string;
    message: string;
}

export interface TeamSubmitResponse {
    team_id: string;
    name: string;
    status: TeamStatus;
    token_active: boolean;
    submmited_at: string | null;
}

export interface TeamApproveResponse {
    team_id: string;
    name: string;
    status: TeamStatus;
    modality_id: string;
}

export interface TeamConfirmDonationResponse {
    member_user_id: string;
    member_matricula: string | null;
    member_name: string | null;
    status: DonationStatus;
}

export interface TeamSelectCaptainResponse {
    team_id: string;
    captain_id: string;
    is_owner: boolean;
    is_captain: boolean;
}

export interface TeamRemoveMemberResponse {
    team_id: string;
    user_id: string;
    name: string | null;
    matricula: string | null;
    administrative_operation: boolean;
}

export interface TeamLeaveResponse {
    team_id: string;
    user_id: string;
}

export interface TeamRejectRequest {
    reason: string;
}

export interface TeamRejectResponse {
    team_id: string;
    name: string;
    status: TeamStatus;
    rejection_reason: string | null;
    rejected_at: string | null;
}

export interface TeamDeleteResponse {
    team_id: string;
}

export interface TeamRegenerateInviteResponse {
    team_id: string;
    invite_token: string;
    token_active: boolean;
}
