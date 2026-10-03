import * as SecureStore from 'expo-secure-store';

const KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
} as const;


export const tokenManager = {
    getAccessToken: (): Promise<string | null> => {
        return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
    },

    getRefreshToken: (): Promise<string | null> => {
        return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
    },

    setTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
        await Promise.all([
            SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken),
            SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken),
        ]);
    },

    clearTokens: async (): Promise<void> => {
        await Promise.all([
            SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
            SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
        ]);
    },

    hasTokens: async (): Promise<boolean> => {
        const [accessToken, refreshToken] = await Promise.all([
            SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
            SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),
        ]);

        return !!(accessToken && refreshToken);
    },
};
