import type { ComponentProps } from 'react';
import { Stack } from 'expo-router/stack';
import { CancelButton, HeaderAddButton } from '@/components/management/header-add-button';
import { colors, fontFamily } from '@/theme';

type ScreenOptions = NonNullable<ComponentProps<typeof Stack.Screen>['options']>;

const sheet: ScreenOptions = {
    presentation: 'formSheet',
    sheetGrabberVisible: true,
    sheetAllowedDetents: [0.6, 1],
    headerLargeTitleEnabled: false,
    headerLeft: () => <CancelButton />,
    headerRight: undefined,
};

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
            <Stack.Screen
                name="[id]/index"
                options={{ title: 'Temporada', headerLargeTitleEnabled: false, headerRight: undefined }}
            />
            <Stack.Screen
                name="[id]/bracket/[modalityId]"
                options={{ title: 'Chaveamento', headerLargeTitleEnabled: false, headerRight: undefined }}
            />
            <Stack.Screen
                name="[id]/bracket/match/[matchId]"
                options={{ title: 'Gerenciar partida', headerLargeTitleEnabled: false, headerRight: undefined }}
            />
            <Stack.Screen name="[id]/edit-dates" options={{ ...sheet, title: 'Datas de inscrição' }} />
            <Stack.Screen name="[id]/reopen" options={{ ...sheet, title: 'Reabrir inscrições' }} />
            <Stack.Screen name="[id]/finish" options={{ ...sheet, title: 'Finalizar temporada' }} />
        </Stack>
    );
}
