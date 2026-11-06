import type { ComponentProps } from 'react';
import { Stack } from 'expo-router/stack';
import { CancelButton } from '@/components/management/header-add-button';
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
                headerTintColor: colors.ink,
                headerStyle: { backgroundColor: colors.background },
                headerTitleStyle: { fontFamily: fontFamily.bold, fontSize: 20, color: colors.ink },
                headerLargeTitleStyle: { fontFamily: fontFamily.bold, fontSize: 28, color: colors.ink },
                headerBackButtonDisplayMode: 'minimal',
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Temporadas', headerLargeTitleEnabled: false }} />
            <Stack.Screen name="history" options={{ title: 'Temporadas anteriores' }} />
            <Stack.Screen
                name="create"
                options={{
                    title: 'Nova temporada',
                    presentation: 'fullScreenModal',
                    headerTitleAlign: 'center',
                    animation: 'slide_from_bottom',
                    headerLeft: () => <CancelButton />,
                    headerRight: undefined,
                }}
            />
            <Stack.Screen
                name="[id]/index"
                options={{ title: 'Temporada', headerLargeTitleEnabled: false }}
            />
            <Stack.Screen
                name="[id]/bracket/[modalityId]"
                options={{ title: 'Chaveamento', headerLargeTitleEnabled: false }}
            />
            <Stack.Screen
                name="[id]/bracket/match/[matchId]"
                options={{ title: 'Gerenciar partida', headerLargeTitleEnabled: false }}
            />
            <Stack.Screen name="[id]/edit-dates" options={{ ...sheet, title: 'Datas de inscrição' }} />
            <Stack.Screen name="[id]/reopen" options={{ ...sheet, title: 'Reabrir inscrições' }} />
        </Stack>
    );
}
