import { Pressable, RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/icon';
import { MatchScoreHeader } from '@/components/match/match-score-header';
import { MatchTimeline } from '@/components/match/match-timeline';
import { ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useMatchDetails } from '@/hooks/useMatches';
import { useMatchLive } from '@/hooks/useRealtime';
import { MatchTypeLabel } from '@/types/enums';
import type { MatchPublicResponse } from '@/types/match';
import { colors, radius, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';

function scoreSummary(match: MatchPublicResponse): string {
    if (match.status === 'SCHEDULED') return 'ainda não começou';

    const base = `${match.team1.score} × ${match.team2.score}`;
    if (match.penalty_result) {
        return `${base} (pênaltis ${match.penalty_result.team1_penalties} × ${match.penalty_result.team2_penalties})`;
    }
    return base;
}

function HeaderTitle({ match }: { match: MatchPublicResponse }) {
    return (
        <View style={styles.headerTitle}>
            <ThemedText variant="section" numberOfLines={1} style={styles.headerTitleText}>
                {match.modality_name ?? 'Partida'}
            </ThemedText>
            <ThemedText variant="caption" numberOfLines={1}>
                {MatchTypeLabel[match.match_type]}
            </ThemedText>
        </View>
    );
}

function ShareButton({ onPress }: { onPress: () => void }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Compartilhar partida"
            onPress={onPress}
            style={({ pressed }) => [styles.shareButton, { opacity: pressed ? 0.7 : 1 }]}
        >
            <Icon name="share" size={18} color={colors.ink} />
        </Pressable>
    );
}

function MatchDetailsContent({ matchId }: { matchId: string }) {
    const details = useMatchDetails(matchId);
    const live = useMatchLive(matchId);
    const match = details.data;

    const refresh = () => details.refetch();

    const handleShare = () => {
        if (!match) return;
        Share.share({
            message: `${match.modality_name ?? 'Partida'}: ${match.team1.name} ${scoreSummary(match)} ${match.team2.name}`,
        });
    };

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
            <Stack.Screen
                options={{
                    headerTitle: () => <HeaderTitle match={match} />,
                    headerRight: () => <ShareButton onPress={handleShare} />,
                }}
            />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={details.isRefetching} onRefresh={refresh} tintColor={colors.primary} />
                }
            >
                <MatchScoreHeader match={match} dataUpdatedAt={details.dataUpdatedAt} />

                {showReconnectHint ? (
                    <View style={styles.reconnectHint}>
                        <Icon name="info" size={16} color={colors.warningText} />
                        <ThemedText variant="caption" style={styles.reconnectText}>
                            Reconectando à transmissão ao vivo… o placar pode estar desatualizado.
                        </ThemedText>
                    </View>
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
        gap: spacing.lg,
    },
    headerTitle: {
        alignItems: 'center',
    },
    headerTitleText: {
        maxWidth: 220,
    },
    shareButton: {
        width: 40,
        height: 40,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.field,
    },
    reconnectHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        padding: spacing.sm,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.warningSoft,
    },
    reconnectText: {
        flex: 1,
        color: colors.warningText,
    },
});
