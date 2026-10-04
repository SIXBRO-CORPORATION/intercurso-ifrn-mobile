import { httpClient } from '@/utils/http-client';
import type { MatchListFilters, MatchListResponse } from '@/types/match-list';
import type {
    MatchCardRequest,
    MatchGoalRequest,
    MatchManagementResponse,
    MatchPenaltyKickRequest,
    MatchPublicResponse,
} from '@/types/match';

const BASE_PATH = '/match';

function unwrap<T>(data: T | undefined, message: string): T {
    if (data === undefined) {
        throw new Error(message);
    }
    return data;
}

class MatchService {
    async listMatches(
        filters: MatchListFilters,
        page: number,
        size: number,
        signal?: AbortSignal
    ): Promise<MatchListResponse> {
        const params = new URLSearchParams({
            season_id: filters.seasonId,
            page: String(page),
            size: String(size),
        });

        if (filters.modalityId) params.set('modality_id', filters.modalityId);
        if (filters.status) params.set('status', filters.status);
        if (filters.dateFrom) params.set('date_from', filters.dateFrom);
        if (filters.dateTo) params.set('date_to', filters.dateTo);

        const response = await httpClient.get<MatchListResponse>(`${BASE_PATH}/?${params.toString()}`, {
            signal,
        });

        return unwrap(response.data, 'O backend não retornou a lista de partidas');
    }

    async getMatchState(matchId: string, signal?: AbortSignal): Promise<MatchPublicResponse> {
        const response = await httpClient.get<MatchPublicResponse>(`${BASE_PATH}/${matchId}`, { signal });

        return unwrap(response.data, 'O backend não retornou os dados da partida');
    }

    async startMatch(matchId: string): Promise<MatchManagementResponse> {
        const response = await httpClient.post<MatchManagementResponse>(
            `${BASE_PATH}/${matchId}/start`
        );

        return unwrap(response.data, 'O backend não retornou os dados da partida iniciada');
    }

    async registerGoal(matchId: string, request: MatchGoalRequest): Promise<MatchManagementResponse> {
        const response = await httpClient.post<MatchManagementResponse>(
            `${BASE_PATH}/${matchId}/goal`,
            request
        );

        return unwrap(response.data, 'O backend não retornou os dados do gol/ponto registrado');
    }

    async registerCard(matchId: string, request: MatchCardRequest): Promise<MatchManagementResponse> {
        const response = await httpClient.post<MatchManagementResponse>(
            `${BASE_PATH}/${matchId}/card`,
            request
        );

        return unwrap(response.data, 'O backend não retornou os dados do cartão registrado');
    }

    async pauseClock(matchId: string): Promise<MatchManagementResponse> {
        const response = await httpClient.post<MatchManagementResponse>(
            `${BASE_PATH}/${matchId}/clock/pause`
        );

        return unwrap(response.data, 'O backend não retornou os dados do cronômetro pausado');
    }

    async resumeClock(matchId: string): Promise<MatchManagementResponse> {
        const response = await httpClient.post<MatchManagementResponse>(
            `${BASE_PATH}/${matchId}/clock/resume`
        );

        return unwrap(response.data, 'O backend não retornou os dados do cronômetro retomado');
    }

    async endPeriod(matchId: string): Promise<MatchManagementResponse> {
        const response = await httpClient.post<MatchManagementResponse>(
            `${BASE_PATH}/${matchId}/period/end`
        );

        return unwrap(response.data, 'O backend não retornou os dados do período encerrado');
    }

    async startPeriod(matchId: string): Promise<MatchManagementResponse> {
        const response = await httpClient.post<MatchManagementResponse>(
            `${BASE_PATH}/${matchId}/period/start`
        );

        return unwrap(response.data, 'O backend não retornou os dados do período iniciado');
    }

    async endSet(matchId: string): Promise<MatchManagementResponse> {
        const response = await httpClient.post<MatchManagementResponse>(
            `${BASE_PATH}/${matchId}/set/end`
        );

        return unwrap(response.data, 'O backend não retornou os dados do set finalizado');
    }

    async finishMatch(matchId: string): Promise<MatchManagementResponse> {
        const response = await httpClient.post<MatchManagementResponse>(
            `${BASE_PATH}/${matchId}/finish`
        );

        return unwrap(response.data, 'O backend não retornou os dados da partida finalizada');
    }

    async startPenaltyShootout(matchId: string): Promise<MatchManagementResponse> {
        const response = await httpClient.post<MatchManagementResponse>(
            `${BASE_PATH}/${matchId}/penalty-shootout/start`
        );

        return unwrap(
            response.data,
            'O backend não retornou os dados da disputa de pênaltis iniciada'
        );
    }

    async registerPenaltyKick(
        matchId: string,
        request: MatchPenaltyKickRequest
    ): Promise<MatchManagementResponse> {
        const response = await httpClient.post<MatchManagementResponse>(
            `${BASE_PATH}/${matchId}/penalty-shootout/kick`,
            request
        );

        return unwrap(
            response.data,
            'O backend não retornou os dados da cobrança de pênalti registrada'
        );
    }

    async endPenaltyShootout(matchId: string): Promise<MatchManagementResponse> {
        const response = await httpClient.post<MatchManagementResponse>(
            `${BASE_PATH}/${matchId}/penalty-shootout/end`
        );

        return unwrap(
            response.data,
            'O backend não retornou os dados da disputa de pênaltis encerrada'
        );
    }

    async undoLastEvent(matchId: string): Promise<MatchManagementResponse> {
        const response = await httpClient.post<MatchManagementResponse>(
            `${BASE_PATH}/${matchId}/event/undo`
        );

        return unwrap(response.data, 'O backend não retornou os dados do evento desfeito');
    }

    async deleteEvent(matchId: string, eventId: string): Promise<MatchManagementResponse> {
        const response = await httpClient.delete<MatchManagementResponse>(
            `${BASE_PATH}/${matchId}/event/${eventId}`
        );

        return unwrap(response.data, 'O backend não retornou os dados do evento deletado');
    }
}

export const matchService = new MatchService();
