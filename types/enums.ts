export type UserRole = 'ADMIN' | 'MONITOR' | 'USER';

export const UserRoleLabel: Record<UserRole, string> = {
    ADMIN: 'Administrador',
    MONITOR: 'Monitor',
    USER: 'Usuário',
};

export type ModalityFormat =
    | 'KNOCKOUT'
    | 'GROUP_STAGE_KNOCKOUT'
    | 'ROUND_ROBIN'
    | 'TRIANGULAR';

export const ModalityFormatLabel: Record<ModalityFormat, string> = {
    KNOCKOUT: 'Mata-Mata',
    GROUP_STAGE_KNOCKOUT: 'Fase de grupo do Mata-Mata',
    ROUND_ROBIN: 'Todos contra todos',
    TRIANGULAR: 'Triangular',
};

export type ScoreType = 'GOALS' | 'POINTS' | 'SETS';

export const ScoreTypeLabel: Record<ScoreType, string> = {
    GOALS: 'Gols',
    POINTS: 'Pontos',
    SETS: 'Sets',
};

export type TeamStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export const TeamStatusLabel: Record<TeamStatus, string> = {
    DRAFT: 'Rascunho',
    SUBMITTED: 'Aprovação Pendente',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
};

export type TeamMemberRole = 'OWNER' | 'CAPTAIN' | 'MEMBER';

export const TeamMemberRoleLabel: Record<TeamMemberRole, string> = {
    OWNER: 'Dono',
    CAPTAIN: 'Capitão',
    MEMBER: 'Membro',
};

export type DonationStatus = 'PENDING_DONATION' | 'DONATION_CONFIRMED';

export const DonationStatusLabel: Record<DonationStatus, string> = {
    PENDING_DONATION: 'Aguardando doação',
    DONATION_CONFIRMED: 'Doação confirmada',
};

export type SeasonStatus =
    | 'DRAFT'
    | 'REGISTRATION_OPEN'
    | 'REGISTRATION_CLOSED'
    | 'IN_PROGRESS'
    | 'FINISHED';

export const SeasonStatusLabel: Record<SeasonStatus, string> = {
    DRAFT: 'Rascunho',
    REGISTRATION_OPEN: 'Inscrições abertas',
    REGISTRATION_CLOSED: 'Inscrições fechadas',
    IN_PROGRESS: 'Em progresso',
    FINISHED: 'Finalizada',
};

export type BracketStatus = 'DRAFT' | 'ACTIVE' | 'FINISHED';

export const BracketStatusLabel: Record<BracketStatus, string> = {
    DRAFT: 'Rascunho',
    ACTIVE: 'Ativo',
    FINISHED: 'Finalizado',
};

export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED';

export const MatchStatusLabel: Record<MatchStatus, string> = {
    SCHEDULED: 'Agendada',
    IN_PROGRESS: 'Em progresso',
    FINISHED: 'Finalizada',
};

export type MatchType = 'REGULAR' | 'SEMIFINAL' | 'THIRD_PLACE' | 'FINAL';

export const MatchTypeLabel: Record<MatchType, string> = {
    REGULAR: 'Regular',
    SEMIFINAL: 'Semifinal',
    THIRD_PLACE: 'Terceiro Lugar',
    FINAL: 'Final',
};

export type MatchCategory = 'GROUP' | 'KNOCKOUT';

export const MatchCategoryLabel: Record<MatchCategory, string> = {
    GROUP: 'Fase de grupos',
    KNOCKOUT: 'Mata-Mata',
};

export type CardType = 'YELLOW' | 'RED';

export const CardTypeLabel: Record<CardType, string> = {
    YELLOW: 'Amarelo',
    RED: 'Vermelho',
};

export type PenaltyKickResult = 'GOAL' | 'MISS';

export const PenaltyKickResultLabel: Record<PenaltyKickResult, string> = {
    GOAL: 'Gol',
    MISS: 'Perdeu',
};

export type EventType =
    | 'MATCH_STARTED'
    | 'MATCH_END'
    | 'PERIOD_START'
    | 'PERIOD_END'
    | 'GOAL'
    | 'POINT'
    | 'CARD_YELLOW'
    | 'CARD_RED'
    | 'EXPULSION'
    | 'SET_END'
    | 'PENALTY_GOAL'
    | 'PENALTY_MISS';

export const EventTypeLabel: Record<EventType, string> = {
    MATCH_STARTED: 'Partida iniciada',
    MATCH_END: 'Partida finalizada',
    PERIOD_START: 'Período iniciado',
    PERIOD_END: 'Período finalizado',
    GOAL: 'Gol',
    POINT: 'Ponto',
    CARD_YELLOW: 'Cartão amarelo',
    CARD_RED: 'Cartão vermelho',
    EXPULSION: 'Expulsão',
    SET_END: 'Fim de set',
    PENALTY_GOAL: 'Pênalti convertido',
    PENALTY_MISS: 'Pênalti perdido',
};
