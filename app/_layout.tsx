import { Slot, useNavigationContainerRef } from 'expo-router';
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from '@react-navigation/native'
import { useEffect } from 'react';
import { useFonts } from 'expo-font'
import { QueryProvider } from '../providers/QueryProvider';
import * as SystemUI from 'expo-system-ui'
import * as SplashScreen from 'expo-splash-screen'
import { useReactNavigationDevTools } from '@dev-plugins/react-navigation'
import { useReactQueryDevTools } from '@dev-plugins/react-query'
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { ToastProvider } from '../providers/ToastProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {useColorScheme} from "react-native";
import {queryClient} from "../QueryClient";

export {
    // Captura qualquer erro lançado pelo componente de Layout.
    ErrorBoundary,
} from 'expo-router'

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
    })

    useEffect(() => {
        if (error) throw error
    }, [error])

    useEffect(() => {
        if (loaded) {
            // Apenas sinaliza que as fontes foram carregadas
        }
    }, [loaded])

    if (!loaded) {
        return null
    }

    return <RootLayoutNav />

}

function RootLayoutNav() {

    const navigationRef = useNavigationContainerRef()
    useReactNavigationDevTools(navigationRef)
    useReactQueryDevTools(queryClient)

    const colorScheme = useColorScheme()

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
    )

}

export default RootLayout