import { ApiError, type ApiResponse } from '@/types/api';

const FIELD_LABELS: Record<string, string> = {
    name: 'Nome',
    modality_id: 'Modalidade',
    photo: 'Foto',
};

function fieldLabel(location: string): string {
    const field = location.split('.').pop() ?? location;
    return FIELD_LABELS[field] ?? field;
}

export function validationMessage(response: Pick<ApiResponse<unknown>, 'data'> | undefined): string | null {
    const errors = response?.data;
    if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return null;

    const lines = Object.entries(errors as Record<string, unknown>)
        .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
        .map(([location, message]) => `${fieldLabel(location)}: ${message}`);

    return lines.length > 0 ? lines.join('\n') : null;
}

export function friendlyErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) {
        if (error.status === 0) {
            return 'Sem conexão. Verifique sua internet e tente de novo.';
        }
        if (error.code === 'VALIDATION_ERROR') {
            const details = validationMessage(error.data);
            if (details) return details;
        }
        if (error.status >= 500) {
            return 'O servidor não conseguiu concluir a operação. Tente de novo em instantes.';
        }
        if (error.message) {
            return error.message;
        }
    }
    return fallback;
}
