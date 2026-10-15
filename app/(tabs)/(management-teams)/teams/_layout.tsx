import { Stack } from 'expo-router/stack';
import { colors, fontFamily } from '@/theme';

export default function TeamsManagementLayout() {
    return (
        <Stack
            screenOptions={{
                headerLargeTitleEnabled: true,
                headerShadowVisible: false,
                headerTitleStyle: { color: colors.label, fontFamily: fontFamily.display },
                headerBackButtonDisplayMode: 'minimal',
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Times' }} />
            <Stack.Screen name="[id]" options={{ title: 'Time', headerLargeTitleEnabled: false }} />
        </Stack>
    );
}
