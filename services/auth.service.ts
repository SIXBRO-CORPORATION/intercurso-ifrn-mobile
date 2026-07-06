import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import { httpClient, API_BASE_URL } from '../utils/http-client';
import { tokenManager } from '../utils/storage';
import type { User } from '../types/user';
import { AuthCallbackParams, AuthCancelledError } from '../types/auth';

const AUTH_CALLBACK_PATH = 'callback';
const SUAP_LOGIN_ENDPOINT = '/auth/login/suap';

class AuthService {

    private getAuthorizationUrl(): string {
        return `${API_BASE_URL}${SUAP_LOGIN_ENDPOINT}?platform=mobile`;
    }

    private getRedirectUri(): string {
        return Linking.createURL(AUTH_CALLBACK_PATH);
    }

    async loginWithSuap(): Promise<User> {
        const authorizationUrl = this.getAuthorizationUrl();
        const redirectUri = this.getRedirectUri();

        const result = await WebBrowser.openAuthSessionAsync(authorizationUrl, redirectUri);

        if (result.type === 'cancel' || result.type === 'dismiss') {
            throw new AuthCancelledError();
        }

        if (result.type !== 'success' || !result.url) {
            throw new Error('Não foi possível concluir o login com o SUAP');
        }

        const { queryParams } = Linking.parse(result.url) as {
            queryParams: AuthCallbackParams | null;
        };

        if (queryParams?.error) {
            throw new Error(queryParams.error);
        }

        if (!queryParams?.token) {
            throw new Error('O backend não retornou um token de acesso');
        }

        tokenManager.setTokens(queryParams.token, queryParams.refresh_token ?? '');

        return this.getMe();
    }

    async getMe(): Promise<User> {
        const response = await httpClient.get<User>('/auth/me');

        if (!response.data) {
            throw new Error('Não foi possível carregar os dados do usuário');
        }

        return response.data;
    }

    async logout(): Promise<void> {
        const refreshToken = tokenManager.getRefreshToken();

        try {
            await httpClient.post(
                '/auth/logout',
                refreshToken ? { refresh_token: refreshToken } : undefined,
                { skipToast: true }
            );
        } catch (error) {
            console.warn('Falha ao invalidar sessão no backend:', error);
        } finally {
            tokenManager.clearTokens();
        }
    }

    isAuthenticated(): boolean {
        return tokenManager.hasTokens();
    }
}

export const authService = new AuthService();
