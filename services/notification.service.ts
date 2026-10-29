import { Platform, PermissionsAndroid } from 'react-native';
import {
    getMessaging,
    requestPermission as requestFcmPermission,
    getToken as getFcmToken,
    onMessage,
    onNotificationOpenedApp as onFcmNotificationOpenedApp,
    getInitialNotification as getFcmInitialNotification,
    onTokenRefresh as onFcmTokenRefresh,
    setBackgroundMessageHandler as setFcmBackgroundMessageHandler,
    subscribeToTopic as subscribeFcmToTopic,
    unsubscribeFromTopic as unsubscribeFcmFromTopic,
    AuthorizationStatus,
    type RemoteMessage,
} from '@react-native-firebase/messaging';
import { httpClient } from '@/utils/http-client';

const BASE_PATH = '/messaging';

export const PUBLIC_TOPICS = ['live_matches', 'season_updates'] as const;

export type { RemoteMessage };

class PushNotificationService {
    private get messaging() {
        return getMessaging();
    }

    async requestPermission(): Promise<boolean> {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
            const result = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );

            if (result !== PermissionsAndroid.RESULTS.GRANTED) {
                return false;
            }
        }

        const authStatus = await requestFcmPermission(this.messaging);

        return (
            authStatus === AuthorizationStatus.AUTHORIZED ||
            authStatus === AuthorizationStatus.PROVISIONAL
        );
    }

    async getToken(): Promise<string | null> {
        try {
            return await getFcmToken(this.messaging);
        } catch (error) {
            console.error('[push-notification] Falha ao obter o token FCM:', error);
            return null;
        }
    }

    async registerDeviceToken(token?: string | null): Promise<void> {
        const deviceToken = token ?? (await this.getToken());
        if (!deviceToken) return;

        const platform: 'ANDROID' | 'IOS' = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

        await httpClient.post(
            `${BASE_PATH}/device-token`,
            { token: deviceToken, platform },
            { skipToast: true }
        );
    }

    async removeDeviceToken(token?: string | null): Promise<void> {
        const deviceToken = token ?? (await this.getToken());
        if (!deviceToken) return;

        await httpClient.delete(`${BASE_PATH}/device-token`, {
            body: JSON.stringify({ token: deviceToken }),
            skipToast: true,
        });
    }

    async subscribeToTopic(topic: string): Promise<void> {
        await subscribeFcmToTopic(this.messaging, topic);
    }

    async unsubscribeFromTopic(topic: string): Promise<void> {
        await unsubscribeFcmFromTopic(this.messaging, topic);
    }

    onTokenRefresh(callback: (token: string) => void): () => void {
        return onFcmTokenRefresh(this.messaging, callback);
    }

    onForegroundMessage(callback: (message: RemoteMessage) => void): () => void {
        return onMessage(this.messaging, callback);
    }

    onNotificationOpenedApp(callback: (message: RemoteMessage) => void): () => void {
        return onFcmNotificationOpenedApp(this.messaging, callback);
    }

    getInitialNotification(): Promise<RemoteMessage | null> {
        return getFcmInitialNotification(this.messaging);
    }

    setBackgroundMessageHandler(handler: (message: RemoteMessage) => Promise<void>): void {
        setFcmBackgroundMessageHandler(this.messaging, handler);
    }
}

export const pushNotificationService = new PushNotificationService();