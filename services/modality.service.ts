import { httpClient } from '@/utils/http-client';
import { ScoreTypeCodec } from '@/types/enums';
import type {
    ModalityConfiguration,
    ModalityCreateRequest,
    ModalityCreateResponse,
} from '@/types/modality';

const BASE_PATH = '/modality';

interface ModalityConfigurationWire extends Omit<ModalityConfiguration, 'score_type'> {
    score_type: string;
}

interface ModalityCreateResponseWire extends Omit<ModalityCreateResponse, 'configuration'> {
    configuration?: ModalityConfigurationWire | null;
}

function parseConfiguration(
    wire: ModalityConfigurationWire | null | undefined
): ModalityConfiguration | undefined {
    if (!wire) {
        return undefined;
    }

    return {
        ...wire,
        score_type: ScoreTypeCodec.fromLabel(wire.score_type),
    };
}

class ModalityService {
    async createModality(request: ModalityCreateRequest): Promise<ModalityCreateResponse> {
        const payload = {
            ...request,
            score_type: ScoreTypeCodec.toLabel(request.score_type),
        };

        const response = await httpClient.post<ModalityCreateResponseWire>(
            `${BASE_PATH}/`,
            payload
        );

        if (!response.data) {
            throw new Error('O backend não retornou os dados da modalidade criada');
        }

        return {
            ...response.data,
            configuration: parseConfiguration(response.data.configuration),
        };
    }
}

export const modalityService = new ModalityService();
