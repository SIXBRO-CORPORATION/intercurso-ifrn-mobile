import { createMMKV } from "react-native-mmkv";

export const storage = createMMKV()

const KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
} as const;

export const tokenManager = {
    getAccessToken: (): string | undefined => {
        return storage.getString(KEYS.ACCESS_TOKEN);
    },

    getRefreshToken: (): string | undefined => {
        return storage.getString(KEYS.REFRESH_TOKEN);
    },

    setTokens: (accessToken: string, refreshToken: string): void => {
        storage.set(KEYS.ACCESS_TOKEN, accessToken);
        storage.set(KEYS.REFRESH_TOKEN, refreshToken);
    },

    clearTokens: (): void => {
        storage.remove(KEYS.ACCESS_TOKEN);
        storage.remove(KEYS.REFRESH_TOKEN);
    },

    hasTokens: (): boolean => {
        return !!(tokenManager.getAccessToken() && tokenManager.getRefreshToken());
    },
};