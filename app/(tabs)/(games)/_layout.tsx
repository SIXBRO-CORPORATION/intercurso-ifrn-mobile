import { Stack } from 'expo-router/stack';
import { colors, fontFamily } from '@/theme';

export default function GamesLayout() {
    return (
        <Stack
            screenOptions={{
                headerLargeTitleEnabled: true,
                headerShadowVisible: false,
                headerTintColor: colors.ink,
                headerStyle: { backgroundColor: colors.background },
                headerTitleStyle: { fontFamily: fontFamily.bold, fontSize: 20, color: colors.ink },
                headerLargeTitleStyle: { fontFamily: fontFamily.bold, fontSize: 28, color: colors.ink },
                headerBackButtonDisplayMode: 'minimal',
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Jogos' }} />
            <Stack.Screen name="match/[matchId]" options={{ title: 'Partida', headerLargeTitleEnabled: false }} />
        </Stack>
    );
}
