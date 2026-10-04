import { Stack } from 'expo-router/stack';
import { CancelButton, HeaderAddButton } from '@/components/management/header-add-button';
import { colors, fontFamily } from '@/theme';

export default function SeasonsLayout() {
    return (
        <Stack
            screenOptions={{
                headerLargeTitleEnabled: true,
                headerShadowVisible: false,
                headerTitleStyle: { color: colors.label, fontFamily: fontFamily.display },
                headerBackButtonDisplayMode: 'minimal',
                headerRight: () => <HeaderAddButton href="/seasons/create" label="Criar temporada" />,
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Temporadas' }} />
            <Stack.Screen
                name="create"
                options={{
                    title: 'Nova temporada',
                    presentation: 'formSheet',
                    sheetGrabberVisible: true,
                    sheetAllowedDetents: [0.9, 1],
                    headerLeft: () => <CancelButton />,
                    headerRight: undefined,
                }}
            />
        </Stack>
    );
}
