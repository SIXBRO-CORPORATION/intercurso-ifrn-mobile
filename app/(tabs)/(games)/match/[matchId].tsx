import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { InfoRow, Section } from '@/components/management/section';
import { MatchScoreHeader } from '@/components/match/match-score-header';
import { MatchTimeline } from '@/components/match/match-timeline';
import { ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useMatchDetails } from '@/hooks/useMatches';
import { useMatchLive } from '@/hooks/useRealtime';
import { MatchCategoryLabel, MatchStatusLabel, MatchTypeLabel } from '@/types/enums';
import { colors, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';

function MatchDetailsContent({ matchId }: { matchId: string }) {
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
            <Stack.Screen options={{ title: match.modality_name ?? 'Partida' }} />
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

                <Section title="Detalhes">
                    <InfoRow label="Modalidade" value={match.modality_name ?? '—'} />
                    <InfoRow label="Fase" value={MatchTypeLabel[match.match_type]} />
                    <InfoRow label="Categoria" value={MatchCategoryLabel[match.match_category]} />
                    <InfoRow label="Status" value={MatchStatusLabel[match.status]} />
                </Section>

                {match.sets.length > 0 ? (
                    <Section title="Sets">
                        {match.sets.map((set) => (
                            <InfoRow
                                key={set.set_number}
                                label={`Set ${set.set_number}`}
                                value={`${set.team1_points} × ${set.team2_points}`}
                            />
                        ))}
                    </Section>
                ) : null}

                <MatchTimeline match={match} />
            </ScrollView>
        </>
    );
}

export default function MatchDetailsScreen() {
    const { matchId } = useLocalSearchParams<{ matchId: string }>();

    return <MatchDetailsContent matchId={matchId} />;
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
