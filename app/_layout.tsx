import { useNavigationContainerRef } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { ThemeProvider } from 'expo-router/react-navigation';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { QueryProvider } from '@/providers/QueryProvider';
import * as SplashScreen from 'expo-splash-screen';
import { useReactNavigationDevTools } from '@dev-plugins/react-navigation';
import { useReactQueryDevTools } from '@dev-plugins/react-query';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ToastProvider } from '@/providers/ToastProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { queryClient } from '@/QueryClient';
import { darkNav, fonts, lightNav } from '@/theme';

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

function RootLayoutNav() {
    const navigationRef = useNavigationContainerRef();
    useReactNavigationDevTools(navigationRef);
    useReactQueryDevTools(queryClient);

    const colorScheme = useColorScheme();

    return (
        <SafeAreaProvider>
            <ThemeProvider value={colorScheme === 'dark' ? darkNav : lightNav}>
                <QueryProvider>
                    <ToastProvider>
                        <AuthProvider>
                            <SplashGate />
                            <Stack screenOptions={{ headerShown: false }}>
                                <Stack.Screen name="(tabs)" />
                                <Stack.Screen
                                    name="profile"
                                    options={{
                                        headerShown: true,
                                        title: 'Perfil',
                                        headerBackButtonDisplayMode: 'minimal',
                                    }}
                                />
                            </Stack>
                        </AuthProvider>
                    </ToastProvider>
                </QueryProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}

export default RootLayout;
