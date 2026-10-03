
function buildLabelCodec<T extends string>(labelMap: Record<T, string>) {
    const reverseMap = Object.entries(labelMap).reduce(
        (acc, [key, label]) => {
            acc[label as string] = key as T;
            return acc;
        },
        {} as Record<string, T>
    );

    return {
        labelMap,
        toLabel: (value: T): string => labelMap[value],
        fromLabel: (label: string): T => {
            const value = reverseMap[label];
            if (!value) {
                throw new Error(
                    `Valor inesperado retornado pela API: "${label}" não corresponde a nenhum valor conhecido.`
                );
            }
            return value;
        },
    };
}

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

export const ModalityFormatCodec = buildLabelCodec<ModalityFormat>({
    KNOCKOUT: 'Mata-Mata',
    GROUP_STAGE_KNOCKOUT: 'Fase de grupo do Mata-Mata',
    ROUND_ROBIN: 'Todos contra todos',
    TRIANGULAR: 'Triangular',
});

export type ScoreType = 'GOALS' | 'POINTS' | 'SETS';

export const ScoreTypeCodec = buildLabelCodec<ScoreType>({
    GOALS: 'Gols',
    POINTS: 'Pontos',
    SETS: 'Sets',
});

export type TeamStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export const TeamStatusCodec = buildLabelCodec<TeamStatus>({
    DRAFT: 'Rascunho',
    SUBMITTED: 'Aprovação Pendente',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
});


export type TeamMemberRole = 'OWNER' | 'CAPTAIN' | 'MEMBER';

export const TeamMemberRoleCodec = buildLabelCodec<TeamMemberRole>({
    OWNER: 'Dono',
    CAPTAIN: 'Capitão',
    MEMBER: 'Membro',
});


export type DonationStatus = 'PENDING_DONATION' | 'DONATION_CONFIRMED';

export const DonationStatusCodec = buildLabelCodec<DonationStatus>({
    PENDING_DONATION: 'Aguardando doação',
    DONATION_CONFIRMED: 'Doação confirmada',
});

export type SeasonStatus =
    | 'DRAFT'
    | 'REGISTRATION_OPEN'
    | 'REGISTRATION_CLOSED'
    | 'IN_PROGRESS'
    | 'FINISHED';

export const SeasonStatusCodec = buildLabelCodec<SeasonStatus>({
    DRAFT: 'Rascunho',
    REGISTRATION_OPEN: 'Inscrições abertas',
    REGISTRATION_CLOSED: 'Inscrições fechadas',
    IN_PROGRESS: 'Em progresso',
    FINISHED: 'Finalizada',
});

export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED';

export const MatchStatusCodec = buildLabelCodec<MatchStatus>({
    SCHEDULED: 'Agendada',
    IN_PROGRESS: 'Em progresso',
    FINISHED: 'Finalizada',
});

export type MatchType = 'REGULAR' | 'SEMIFINAL' | 'THIRD_PLACE' | 'FINAL';

export const MatchTypeCodec = buildLabelCodec<MatchType>({
    REGULAR: 'Regular',
    SEMIFINAL: 'Semifinal',
    THIRD_PLACE: 'Terceiro Lugar',
    FINAL: 'Final',
});

export type MatchCategory = 'GROUP' | 'KNOCKOUT';

export const MatchCategoryCodec = buildLabelCodec<MatchCategory>({
    GROUP: 'Fase de grupos',
    KNOCKOUT: 'Mata-Mata',
});

export type CardType = 'YELLOW' | 'RED';

export const CardTypeCodec = buildLabelCodec<CardType>({
    YELLOW: 'Amarelo',
    RED: 'Vermelho',
});

export type PenaltyKickResult = 'GOAL' | 'MISS';

export const PenaltyKickResultCodec = buildLabelCodec<PenaltyKickResult>({
    GOAL: 'Gol',
    MISS: 'Perdeu',
});

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

export const EventTypeCodec = buildLabelCodec<EventType>({
    MATCH_STARTED: 'Partida iniciada',
    MATCH_END: 'Partida finalizada',
    PERIOD_START: 'Período iniciado',
    PERIOD_END: 'Período finalizado',
    GOAL: 'Gol',
    POINT: 'Ponto',
    CARD_YELLOW: 'Cartão amerelo',
    CARD_RED: 'Cartão vermelho',
    EXPULSION: 'Expulsão',
    SET_END: 'Fim de set',
    PENALTY_GOAL: 'Pênalti convertido',
    PENALTY_MISS: 'Pênalti perdido',
});
