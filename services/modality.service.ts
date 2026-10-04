import { httpClient } from '@/utils/http-client';
import type {
    ModalityCreateRequest,
    ModalityCreateResponse,
} from '@/types/modality';
import type { ModalitySummaryResponse } from '@/types/modality-list';

const BASE_PATH = '/modality';

class ModalityService {
    async listModalities(seasonId?: string, signal?: AbortSignal): Promise<ModalitySummaryResponse[]> {
        const query = seasonId ? `?season_id=${encodeURIComponent(seasonId)}` : '';
        const response = await httpClient.get<ModalitySummaryResponse[]>(`${BASE_PATH}/${query}`, { signal });

        if (!response.data) {
            throw new Error('O backend não retornou a lista de modalidades');
        }

        return response.data;
    }

    async createModality(request: ModalityCreateRequest): Promise<ModalityCreateResponse> {
        const response = await httpClient.post<ModalityCreateResponse>(`${BASE_PATH}/`, request);

        if (!response.data) {
            throw new Error('O backend não retornou os dados da modalidade criada');
        }

        return response.data;
    }
}

export const modalityService = new ModalityService();
