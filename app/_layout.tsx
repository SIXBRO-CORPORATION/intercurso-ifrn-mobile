import { router, useNavigationContainerRef } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { ThemeProvider } from 'expo-router/react-navigation';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryProvider } from '@/providers/QueryProvider';
import * as SplashScreen from 'expo-splash-screen';
import { useReactNavigationDevTools } from '@dev-plugins/react-navigation';
import { useReactQueryDevTools } from '@dev-plugins/react-query';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ToastProvider, useToast } from '@/providers/ToastProvider';
import {
    pushNotificationService,
    PUBLIC_TOPICS,
    type RemoteMessage,
} from '@/services/notification.service';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/QueryClient';
import { fonts, navigationTheme } from '@/theme';

export {
    ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

function RootLayout() {
    const [loaded, error] = useFonts(fonts);

    useEffect(() => {
        if (error) throw error;
    }, [error]);

    if (!loaded) {
        return null;
    }

    return <RootLayoutNav />;
}

function SplashGate() {
    const { isInitializing } = useAuth();

    useEffect(() => {
        if (!isInitializing) {
            SplashScreen.hideAsync();
        }
    }, [isInitializing]);

    return null;
}

function navigateFromPushMessage(message: RemoteMessage) {
    const matchId = message.data?.match_id;
    if (typeof matchId === 'string' && matchId.length > 0) {
        router.push(`/match/${matchId}` as never);
    }
}

function PushNotificationListener() {
    const { info } = useToast();

    useEffect(() => {
        (async () => {
            const granted = await pushNotificationService.requestPermission();
            if (!granted) return;

            await Promise.all(
                PUBLIC_TOPICS.map((topic) => pushNotificationService.subscribeToTopic(topic))
            ).catch((error) => {
                console.warn('[push-notification] Falha ao inscrever nos tópicos públicos:', error);
            });
        })();

        const unsubscribeForeground = pushNotificationService.onForegroundMessage((message) => {
            const text = [message.notification?.title, message.notification?.body]
                .filter(Boolean)
                .join(' — ');
            if (text) info(text);
        });

        const unsubscribeOpenedApp = pushNotificationService.onNotificationOpenedApp(
            navigateFromPushMessage
        );

        pushNotificationService.getInitialNotification().then((message) => {
            if (message) navigateFromPushMessage(message);
        });

        const unsubscribeTokenRefresh = pushNotificationService.onTokenRefresh((token) => {
            pushNotificationService.registerDeviceToken(token).catch((error) => {
                console.warn('[push-notification] Falha ao atualizar o device token:', error);
            });
        });

        return () => {
            unsubscribeForeground();
            unsubscribeOpenedApp();
            unsubscribeTokenRefresh();
        };
    }, [info]);

    return null;
}

function RootNavigator() {
    const { isInitializing, isAuthenticated, hasEnteredAsVisitor } = useAuth();

    if (isInitializing) {
        return null;
    }

    const canEnterApp = isAuthenticated || hasEnteredAsVisitor;

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={!canEnterApp}>
                <Stack.Screen name="welcome" />
            </Stack.Protected>
            <Stack.Protected guard={canEnterApp}>
                <Stack.Screen name="(tabs)" />
            </Stack.Protected>
        </Stack>
    );
}

function RootLayoutNav() {
    const navigationRef = useNavigationContainerRef();
    useReactNavigationDevTools(navigationRef);
    useReactQueryDevTools(queryClient);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <ThemeProvider value={navigationTheme}>
                    <QueryProvider>
                        <BottomSheetModalProvider>
                            <ToastProvider>
                                <AuthProvider>
                                    <SplashGate />
                                    <PushNotificationListener />
                                    <RootNavigator />
                                </AuthProvider>
                            </ToastProvider>
                        </BottomSheetModalProvider>
                    </QueryProvider>
                </ThemeProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

export default RootLayout;