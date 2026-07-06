import { Slot, useNavigationContainerRef } from 'expo-router';
import { ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { QueryProvider } from '../providers/QueryProvider';
import * as SplashScreen from 'expo-splash-screen';
import { useReactNavigationDevTools } from '@dev-plugins/react-navigation';
import { useReactQueryDevTools } from '@dev-plugins/react-query';
import { AuthProvider } from '../hooks/useAuth';
import { ToastProvider } from '../providers/ToastProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { queryClient } from '../QueryClient';

export {
    // Captura qualquer erro lançado pelo componente de Layout.
    ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

function RootLayout() {
    const [loaded, error] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        Inter: require('../assets/fonts/Inter_18pt-Regular.ttf'),
        'Inter-extralight': require('../assets/fonts/Inter_18pt-ExtraLight.ttf'),
        'Inter-light': require('../assets/fonts/Inter_18pt-Light.ttf'),
        'Inter-semibold': require('../assets/fonts/Inter_18pt-SemiBold.ttf'),
        'Inter-bold': require('../assets/fonts/Inter_24pt-Bold.ttf'),
        'Inter-extrabold': require('../assets/fonts/Inter_18pt-ExtraBold.ttf'),
    });

    useEffect(() => {
        if (error) throw error;
    }, [error]);

    useEffect(() => {
        if (loaded) {
            // Oculta a Splash Screen assim que as fontes carregarem
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return <RootLayoutNav />;
}

function RootLayoutNav() {
    const navigationRef = useNavigationContainerRef();
    useReactNavigationDevTools(navigationRef);
    useReactQueryDevTools(queryClient);

    const colorScheme = useColorScheme();

    return (
        <SafeAreaProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <QueryProvider>
                    <ToastProvider>
                        <AuthProvider>
                            <Slot />
                        </AuthProvider>
                    </ToastProvider>
                </QueryProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}

export default RootLayout;