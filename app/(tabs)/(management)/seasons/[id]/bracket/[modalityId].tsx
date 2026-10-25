import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { BracketManagement } from '@/components/brackets/bracket-management';
import { ManagementGuard } from '@/components/management/management-guard';

function BracketRouteContent({ seasonId, modalityId }: { seasonId: string; modalityId: string }) {
    const [title, setTitle] = useState('Chaveamento');

    return (
        <>
            <Stack.Screen options={{ title }} />
            <BracketManagement
                seasonId={seasonId}
                modalityId={modalityId}
                onTitleChange={setTitle}
                onViewTree={() => router.push(`/(brackets)/${modalityId}` as never)}
                onUnavailableBack={() => router.back()}
            />
        </>
    );
}

export default function BracketManagementScreen() {
    const { id, modalityId } = useLocalSearchParams<{ id: string; modalityId: string }>();

    return (
        <ManagementGuard>
            <BracketRouteContent seasonId={id} modalityId={modalityId} />
        </ManagementGuard>
    );
}
