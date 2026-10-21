import { Stack } from 'expo-router/stack';
import { colors, fontFamily } from '@/theme';

export default function TeamsLayout() {
    return (
        <Stack
            screenOptions={{
                headerLargeTitleEnabled: false,
                headerShadowVisible: false,
                headerTintColor: colors.ink,
                headerStyle: { backgroundColor: colors.background },
                headerTitleStyle: { fontFamily: fontFamily.bold, fontSize: 20, color: colors.ink },
                headerBackButtonDisplayMode: 'minimal',
            }}
        >
            <Stack.Screen name="index" options={{ title: '' }} />
            <Stack.Screen name="team/new" options={{ title: 'Criar equipe' }} />
            <Stack.Screen name="team/[id]" options={{ title: 'Equipe' }} />
            <Stack.Screen name="join/index" options={{ title: 'Entrar em uma equipe' }} />
            <Stack.Screen name="join/[token]" options={{ title: 'Convite' }} />
        </Stack>
    );
}
