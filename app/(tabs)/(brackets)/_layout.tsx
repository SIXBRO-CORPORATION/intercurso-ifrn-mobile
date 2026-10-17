import { Stack } from 'expo-router/stack';
import { colors, fontFamily } from '@/theme';

export default function BracketsLayout() {
    return (
        <Stack
            screenOptions={{
                headerLargeTitleEnabled: true,
                headerShadowVisible: false,
                headerTintColor: colors.ink,
                headerStyle: { backgroundColor: colors.background },
                headerTitleStyle: { fontFamily: fontFamily.bold, fontSize: 20, color: colors.ink },
                headerLargeTitleStyle: { fontFamily: fontFamily.bold, fontSize: 28, color: colors.ink },
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Chaves' }} />
            <Stack.Screen name="[modalityId]" options={{ title: 'Chaves', headerLargeTitleEnabled: false }} />
        </Stack>
    );
}
