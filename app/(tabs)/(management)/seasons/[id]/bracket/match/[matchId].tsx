import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ManagementGuard } from '@/components/management/management-guard';
import { MatchScoreHeader } from '@/components/match/match-score-header';
import { MatchTimeline } from '@/components/match/match-timeline';
import { MonitorPanel } from '@/components/match/monitor-panel';
import { ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useMatchDetails } from '@/hooks/useMatches';
import { useMatchLive } from '@/hooks/useRealtime';
import { colors, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';

function ManageMatchContent({ matchId }: { matchId: string }) {
    const details = useMatchDetails(matchId);
    const live = useMatchLive(matchId);
    const match = details.data;

    const refresh = () => details.refetch();

    if (details.isPending) {
        return <LoadingState label="Carregando partida…" />;
    }

    if (details.isError || !match) {
        return (
            <ErrorState
                title="Não foi possível carregar a partida"
                description={friendlyErrorMessage(details.error, 'Tente de novo.')}
                onRetry={refresh}
                retrying={details.isRefetching}
            />
        );
    }

    const showReconnectHint =
        match.status === 'IN_PROGRESS' && (live.status === 'reconnecting' || live.status === 'error');

    return (
        <>
            <Stack.Screen options={{ title: 'Gerenciar partida' }} />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={details.isRefetching} onRefresh={refresh} />}
            >
                <MatchScoreHeader match={match} dataUpdatedAt={details.dataUpdatedAt} />

                {showReconnectHint ? (
                    <ThemedText variant="caption" style={styles.liveHint}>
                        Reconectando à transmissão ao vivo… o placar pode estar desatualizado.
                    </ThemedText>
                ) : null}

                <MonitorPanel match={match} />

                <MatchTimeline match={match} />
            </ScrollView>
        </>
    );
}

export default function ManageMatchScreen() {
    const { matchId } = useLocalSearchParams<{ matchId: string }>();

    return (
        <ManagementGuard>
            <ManageMatchContent matchId={matchId} />
        </ManagementGuard>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.md,
    },
    liveHint: {
        textAlign: 'center',
        color: colors.secondaryLabel as string,
    },
});
