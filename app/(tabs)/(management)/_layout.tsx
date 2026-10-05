import { Stack } from 'expo-router/stack';
import { AvatarMenu } from '@/components/avatar-menu';
import { colors, fontFamily } from '@/theme';

export default function ManagementLayout() {
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
            <Stack.Screen name="index" options={{ title: 'Gestão' }} />
            <Stack.Screen name="seasons" options={{ headerShown: false }} />
            <Stack.Screen name="modalities" options={{ headerShown: false }} />
            <Stack.Screen name="teams" options={{ headerShown: false }} />
        </Stack>
    );
}
