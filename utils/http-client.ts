import { fetch } from 'expo/fetch';
import { tokenManager } from './storage';
import { ApiError, type ApiResponse } from '@/types/api';
import { validationMessage } from './api-error-message';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

if (!API_BASE_URL) {
    console.error(
        '[http-client] EXPO_PUBLIC_API_URL não está definida. Copie .env.example para .env ' +
            '(ou .env.development/.env.production), defina a URL do backend e reinicie o Metro ' +
            '("npx expo start -c"). Até lá, qualquer chamada à API vai falhar de forma controlada.'
    );
}

interface RequestConfig extends RequestInit {
    skipAuth?: boolean;
    skipToast?: boolean;
}

function serializeBody(body: unknown): BodyInit | undefined {
    if (body === undefined || body === null) return undefined;
    if (body instanceof FormData) return body;
    return JSON.stringify(body);
}

let toastCallback: ((message: string, type: 'success' | 'error') => void) | null = null;

export const setToastCallback = (callback: (message: string, type: 'success' | 'error') => void) => {
    toastCallback = callback;
};

class HttpClient {

    private refreshPromise: Promise<string | null> | null = null;

    private getOrCreateRefreshPromise(): Promise<string | null> {
        if (!this.refreshPromise) {
            this.refreshPromise = this.refreshToken().finally(() => {
                this.refreshPromise = null;
            });
        }
        return this.refreshPromise;
    }

    private async refreshToken(): Promise<string | null> {
        const refreshToken = await tokenManager.getRefreshToken();
        if (!refreshToken) {
            return null;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            const { access_token, refresh_token } = data.data;

            await tokenManager.setTokens(access_token, refresh_token);
            return access_token;
        } catch (error) {
            await tokenManager.clearTokens();
            return null;
        }
    }

    private async request<T>(
        endpoint: string,
        config: RequestConfig = {}
    ): Promise<ApiResponse<T>> {
        const { skipAuth = false, skipToast = false, headers = {}, ...restConfig } = config;

        if (!API_BASE_URL) {
            const error = new ApiError(
                'App não configurado: defina EXPO_PUBLIC_API_URL e reinicie o Metro.',
                0,
                'MISSING_API_URL'
            );

            if (!skipToast && toastCallback) {
                toastCallback(error.message, 'error');
            }

            return Promise.reject(error);
        }

        const url = `${API_BASE_URL}${endpoint}`;
        const accessToken = await tokenManager.getAccessToken();

        const requestHeaders = new Headers(headers as HeadersInit);

        const isFormData = restConfig.body instanceof FormData;
        if (!isFormData && !requestHeaders.has('Content-Type')) {
            requestHeaders.set('Content-Type', 'application/json');
        }

        if (!skipAuth && accessToken) {
            requestHeaders.set('Authorization', `Bearer ${accessToken}`);
        }

        try {
            const response = await fetch(url, {
                ...restConfig,
                headers: requestHeaders,
            });

            if (response.status === 401 && !skipAuth) {
                const newToken = await this.getOrCreateRefreshPromise();

                if (newToken) {
                    return this.request<T>(endpoint, config);
                }
            }

            const data: ApiResponse<T> = await response.json();

            if (!response.ok) {
                const errorMessage =
                    (data.code === 'VALIDATION_ERROR' && validationMessage(data)) ||
                    data.error ||
                    'Ocorreu um erro inesperado';

                if (!skipToast && toastCallback) {
                    toastCallback(errorMessage, 'error');
                }

                return Promise.reject(
                    new ApiError(errorMessage, response.status, data.code, data)
                );
            }

            if (!skipToast && data.message && toastCallback && restConfig.method !== 'GET') {
                toastCallback(data.message, 'success');
            }

            return data;
        } catch (error) {
            if (error instanceof ApiError) {
                return Promise.reject(error);
            }

            if (!skipToast && toastCallback) {
                toastCallback('Erro de conexão. Tente novamente.', 'error');
            }

            return Promise.reject(new ApiError('Erro de conexão. Tente novamente.', 0, 'NETWORK_ERROR'));
        }
    }

    async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { ...config, method: 'GET', skipToast: true });
    }

    async post<T>(
        endpoint: string,
        body?: unknown,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...config,
            method: 'POST',
            body: serializeBody(body),
        });
    }

    async patch<T>(
        endpoint: string,
        body?: unknown,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...config,
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async put<T>(
        endpoint: string,
        body?: unknown,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            ...config,
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { ...config, method: 'DELETE' });
    }
}

export const httpClient = new HttpClient();