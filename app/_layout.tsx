import { useNavigationContainerRef } from 'expo-router';
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
import { ToastProvider } from '@/providers/ToastProvider';
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

function RootNavigator() {
    const { isInitializing, isAuthenticated, hasEnteredAsVisitor } = useAuth();

    if (isInitializing) {
        return null;
    }

    const showWelcome = !isAuthenticated && !hasEnteredAsVisitor;

    return (
        <Stack screenOptions={{ headerShown: false }}>
            {showWelcome ? <Stack.Screen name="welcome" /> : <Stack.Screen name="(tabs)" />}
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
