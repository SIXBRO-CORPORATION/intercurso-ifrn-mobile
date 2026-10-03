import { httpClient } from '@/utils/http-client';
import type {
    MatchCardRequest,
    MatchGoalRequest,
    MatchManagementResponse,
    MatchPenaltyKickRequest,
} from '@/types/match';

const BASE_PATH = '/match';

function unwrap<T>(data: T | undefined, message: string): T {
    if (data === undefined) {
        throw new Error(message);
    }
    return data;
}

class MatchService {
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
