import { ApiError } from '@/types/api';

export function friendlyErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) {
        if (error.status === 0) {
            return 'Sem conexão. Verifique sua internet e tente de novo.';
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
