import { Stack } from 'expo-router/stack';
import { AvatarMenu } from '@/components/avatar-menu';
import { colors, fontFamily } from '@/theme';

export default function TeamsLayout() {
    return (
        <Stack
            screenOptions={{
                headerLargeTitleEnabled: true,
                headerShadowVisible: false,
                headerTitleStyle: { color: colors.label, fontFamily: fontFamily.display },
                headerBackButtonDisplayMode: 'minimal',
                headerRight: () => <AvatarMenu />,
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Times' }} />
            <Stack.Screen
                name="team/new"
                options={{ title: 'Criar time', headerLargeTitleEnabled: false, headerRight: undefined }}
            />
            <Stack.Screen
                name="team/[id]"
                options={{ title: 'Time', headerLargeTitleEnabled: false, headerRight: undefined }}
            />
            <Stack.Screen
                name="join/index"
                options={{ title: 'Entrar em um time', headerLargeTitleEnabled: false, headerRight: undefined }}
            />
            <Stack.Screen
                name="join/[token]"
                options={{ title: 'Convite', headerLargeTitleEnabled: false, headerRight: undefined }}
            />
        </Stack>
    );
}
