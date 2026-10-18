import { useLocalSearchParams } from 'expo-router';
import { ManagementGuard } from '@/components/management/management-guard';
import { ManageMatchScreenContent } from '@/components/match/manage-match-screen';

export default function ManageMatchScreen() {
    const { id, matchId, view } = useLocalSearchParams<{ id: string; matchId: string; view?: string }>();

    return (
        <ManagementGuard>
            <ManageMatchScreenContent seasonId={id} matchId={matchId} view={view} />
        </ManagementGuard>
    );
}
