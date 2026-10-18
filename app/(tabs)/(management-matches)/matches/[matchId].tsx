import { useLocalSearchParams } from 'expo-router';
import { ManagementGuard } from '@/components/management/management-guard';
import { ManageMatchScreenContent } from '@/components/match/manage-match-screen';

export default function PartidaDetailScreen() {
    const { matchId, seasonId, view } = useLocalSearchParams<{ matchId: string; seasonId: string; view?: string }>();

    return (
        <ManagementGuard>
            <ManageMatchScreenContent seasonId={seasonId} matchId={matchId} view={view} />
        </ManagementGuard>
    );
}
