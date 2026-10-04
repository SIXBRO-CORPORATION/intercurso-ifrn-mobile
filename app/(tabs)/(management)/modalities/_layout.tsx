import { Stack } from 'expo-router/stack';
import { CancelButton, HeaderAddButton } from '@/components/management/header-add-button';
import { colors, fontFamily } from '@/theme';

export default function ModalitiesLayout() {
    return (
        <Stack
            screenOptions={{
                headerLargeTitleEnabled: true,
                headerShadowVisible: false,
                headerTitleStyle: { color: colors.label, fontFamily: fontFamily.display },
                headerBackButtonDisplayMode: 'minimal',
                headerRight: () => <HeaderAddButton href="/modalities/create" label="Criar modalidade" />,
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Modalidades' }} />
            <Stack.Screen
                name="create"
                options={{
                    title: 'Nova modalidade',
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
