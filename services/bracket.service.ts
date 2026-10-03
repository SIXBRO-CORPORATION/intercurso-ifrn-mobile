import { httpClient } from '@/utils/http-client';
import type {
    BracketConfigSuggestionResponse,
    BracketCreateRequest,
    BracketDeleteMatchResponse,
    BracketDetailResponse,
    BracketMatchResponse,
    BracketPreviewParams,
    BracketResponse,
    BracketSummaryResponse,
} from '@/types/bracket';
import type { MatchResponse, MatchUpdateRequest } from '@/types/match';

const BASE_PATH = '/bracket';

function unwrap<T>(data: T | undefined, message: string): T {
    if (data === undefined) {
        throw new Error(message);
    }
    return data;
}

class BracketService {
    async previewConfiguration(
        params: BracketPreviewParams,
        signal?: AbortSignal
    ): Promise<BracketConfigSuggestionResponse> {
        const query = new URLSearchParams({
            modality_id: params.modality_id,
            format: params.format,
        }).toString();

        const response = await httpClient.get<BracketConfigSuggestionResponse>(
            `${BASE_PATH}/preview?${query}`,
            { signal }
        );

        return unwrap(response.data, 'O backend não retornou a sugestão de configuração');
    }

    async listBracketsBySeason(
        seasonId: string,
        signal?: AbortSignal
    ): Promise<BracketSummaryResponse[]> {
        const response = await httpClient.get<BracketSummaryResponse[]>(
            `${BASE_PATH}/season/${seasonId}`,
            { signal }
        );

        return unwrap(response.data, 'O backend não retornou a lista de chaveamentos');
    }

    async getBracketDetails(
        bracketId: string,
        signal?: AbortSignal
    ): Promise<BracketDetailResponse> {
        const response = await httpClient.get<BracketDetailResponse>(
            `${BASE_PATH}/${bracketId}`,
            { signal }
        );

        return unwrap(response.data, 'O backend não retornou os detalhes do chaveamento');
    }

    async listBracketMatches(
        bracketId: string,
        signal?: AbortSignal
    ): Promise<BracketMatchResponse[]> {
        const response = await httpClient.get<BracketMatchResponse[]>(
            `${BASE_PATH}/${bracketId}/matches`,
            { signal }
        );

        return unwrap(response.data, 'O backend não retornou as partidas do chaveamento');
    }

    async createBracket(request: BracketCreateRequest): Promise<BracketResponse> {
        const response = await httpClient.post<BracketResponse>(`${BASE_PATH}/`, request);

        return unwrap(response.data, 'O backend não retornou os dados do chaveamento criado');
    }

    async resortBracket(bracketId: string): Promise<BracketResponse> {
        const response = await httpClient.post<BracketResponse>(`${BASE_PATH}/${bracketId}/resort`);

        return unwrap(response.data, 'O backend não retornou os dados do chaveamento re-sorteado');
    }

    async updateMatch(matchId: string, request: MatchUpdateRequest): Promise<MatchResponse> {
        const response = await httpClient.patch<MatchResponse>(
            `${BASE_PATH}/match/${matchId}`,
            request
        );

        return unwrap(response.data, 'O backend não retornou os dados da partida atualizada');
    }

    async deleteMatch(matchId: string): Promise<BracketDeleteMatchResponse> {
        const response = await httpClient.delete<BracketDeleteMatchResponse>(
            `${BASE_PATH}/match/${matchId}`
        );

        return unwrap(response.data, 'O backend não retornou os dados da partida removida');
    }
}

export const bracketService = new BracketService();
