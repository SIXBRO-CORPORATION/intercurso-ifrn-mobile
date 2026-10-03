import { httpClient } from '@/utils/http-client';
import type {
    ModalityCreateRequest,
    ModalityCreateResponse,
} from '@/types/modality';

const BASE_PATH = '/modality';

class ModalityService {
    async createModality(request: ModalityCreateRequest): Promise<ModalityCreateResponse> {
        const response = await httpClient.post<ModalityCreateResponse>(`${BASE_PATH}/`, request);

        if (!response.data) {
            throw new Error('O backend não retornou os dados da modalidade criada');
        }

        return response.data;
    }
}

export const modalityService = new ModalityService();
