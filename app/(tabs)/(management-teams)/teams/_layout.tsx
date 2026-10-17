import { Stack } from 'expo-router/stack';
import { colors, fontFamily } from '@/theme';

export default function TeamsManagementLayout() {
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
            <Stack.Screen name="[id]" options={{ title: 'Equipe' }} />
        </Stack>
    );
}
