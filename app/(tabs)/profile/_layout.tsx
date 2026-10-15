import { Stack } from 'expo-router/stack';
import { colors, fontFamily } from '@/theme';

export default function ProfileLayout() {
    return (
        <Stack
            screenOptions={{
                headerShadowVisible: false,
                headerTintColor: colors.ink,
                headerStyle: { backgroundColor: colors.background },
                headerTitleStyle: { fontFamily: fontFamily.bold, fontSize: 20, color: colors.ink },
                headerBackButtonDisplayMode: 'minimal',
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Perfil' }} />
        </Stack>
    );
}
