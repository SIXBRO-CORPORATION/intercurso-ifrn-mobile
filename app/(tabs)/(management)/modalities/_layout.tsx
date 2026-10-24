import { Stack } from 'expo-router/stack';
import { CancelButton, HeaderAddButton } from '@/components/management/header-add-button';
import { colors, fontFamily } from '@/theme';

export default function ModalitiesLayout() {
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
                headerRight: () => <HeaderAddButton href="/modalities/create" label="Criar modalidade" />,
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Modalidades' }} />
            <Stack.Screen
                name="create"
                options={{
                    title: 'Nova modalidade',
                    headerTitleAlign: 'center',
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                    headerLeft: () => <CancelButton />,
                    headerRight: undefined,
                }}
            />
        </Stack>
    );
}
