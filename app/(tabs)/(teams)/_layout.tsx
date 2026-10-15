import { Stack } from 'expo-router/stack';
import { colors, fontFamily } from '@/theme';

export default function TeamsLayout() {
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
            <Stack.Screen name="index" options={{ title: 'Equipes' }} />
            <Stack.Screen name="team/new" options={{ title: 'Criar equipe', headerLargeTitleEnabled: false }} />
            <Stack.Screen name="team/[id]" options={{ title: 'Equipe', headerLargeTitleEnabled: false }} />
            <Stack.Screen
                name="join/index"
                options={{ title: 'Entrar em uma equipe', headerLargeTitleEnabled: false }}
            />
            <Stack.Screen name="join/[token]" options={{ title: 'Convite', headerLargeTitleEnabled: false }} />
        </Stack>
    );
}
