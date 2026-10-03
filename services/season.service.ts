import { httpClient } from '@/utils/http-client';
import { SeasonStatusCodec, type SeasonStatus } from '@/types/enums';
import type {
    SeasonCreateRequest,
    SeasonCreateResponse,
    SeasonDetails,
    SeasonEditDatesRequest,
    SeasonFinishRequest,
    SeasonListFilters,
    SeasonReopenRequest,
    SeasonStatusResponse,
    SeasonSummary,
} from '@/types/season';

const BASE_PATH = '/season';

type WithWireStatus<T extends { status: SeasonStatus }> = Omit<T, 'status'> & {
    status: string;
};

type SeasonCreateResponseWire = WithWireStatus<SeasonCreateResponse>;
type SeasonSummaryWire = WithWireStatus<SeasonSummary>;
type SeasonDetailsWire = WithWireStatus<SeasonDetails>;
type SeasonStatusResponseWire = WithWireStatus<SeasonStatusResponse>;

function parseStatus<T extends { status: SeasonStatus }>(wire: WithWireStatus<T>): T {
    return {
        ...wire,
        status: SeasonStatusCodec.fromLabel(wire.status),
    } as T;
}

function unwrap<T>(data: T | undefined, message: string): T {
    if (data === undefined) {
        throw new Error(message);
    }
    return data;
}

class SeasonService {
    async createSeason(request: SeasonCreateRequest): Promise<SeasonCreateResponse> {
        const response = await httpClient.post<SeasonCreateResponseWire>(`${BASE_PATH}/`, request);

        return parseStatus(
            unwrap(response.data, 'O backend não retornou os dados da temporada criada')
        );
    }

    async listSeasons(filters?: SeasonListFilters, signal?: AbortSignal): Promise<SeasonSummary[]> {
        const params = new URLSearchParams();

        if (filters?.status) {
            params.set('status', SeasonStatusCodec.toLabel(filters.status));
        }
        if (filters?.year !== undefined) {
            params.set('year', String(filters.year));
        }

        const query = params.toString();
        const endpoint = query ? `${BASE_PATH}/?${query}` : `${BASE_PATH}/`;

        const response = await httpClient.get<SeasonSummaryWire[]>(endpoint, { signal });

        return unwrap(response.data, 'O backend não retornou a lista de temporadas').map(
            (wire) => parseStatus(wire)
        );
    }

    async getActiveSeason(signal?: AbortSignal): Promise<SeasonSummary> {
        const response = await httpClient.get<SeasonSummaryWire>(`${BASE_PATH}/active`, { signal });

        return parseStatus(
            unwrap(response.data, 'O backend não retornou a temporada ativa')
        );
    }

    async getSeasonDetails(seasonId: string, signal?: AbortSignal): Promise<SeasonDetails> {
        const response = await httpClient.get<SeasonDetailsWire>(`${BASE_PATH}/${seasonId}`, { signal });

        return parseStatus(
            unwrap(response.data, 'O backend não retornou os detalhes da temporada')
        );
    }

    async editSeasonDates(
        seasonId: string,
        request: SeasonEditDatesRequest
    ): Promise<SeasonStatusResponse> {
        const response = await httpClient.patch<SeasonStatusResponseWire>(
            `${BASE_PATH}/${seasonId}/dates`,
            request
        );

        return parseStatus(
            unwrap(response.data, 'O backend não retornou os dados da temporada atualizada')
        );
    }

    async closeRegistration(seasonId: string): Promise<SeasonStatusResponse> {
        const response = await httpClient.post<SeasonStatusResponseWire>(
            `${BASE_PATH}/${seasonId}/close-registration`
        );

        return parseStatus(
            unwrap(response.data, 'O backend não retornou os dados da temporada')
        );
    }

    async reopenRegistration(
        seasonId: string,
        request: SeasonReopenRequest
    ): Promise<SeasonStatusResponse> {
        const response = await httpClient.post<SeasonStatusResponseWire>(
            `${BASE_PATH}/${seasonId}/reopen-registration`,
            request
        );

        return parseStatus(
            unwrap(response.data, 'O backend não retornou os dados da temporada')
        );
    }

    async finishSeason(
        seasonId: string,
        request: SeasonFinishRequest
    ): Promise<SeasonStatusResponse> {
        const response = await httpClient.post<SeasonStatusResponseWire>(
            `${BASE_PATH}/${seasonId}/finish`,
            request
        );

        return parseStatus(
            unwrap(response.data, 'O backend não retornou os dados da temporada finalizada')
        );
    }
}

export const seasonService = new SeasonService();
