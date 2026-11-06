import { memo, useCallback } from 'react';
import { FlatList, type ListRenderItemInfo, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { Icon } from '@/components/icon';
import { SeasonStatusBadge } from '@/components/management/season-status-badge';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useSeasons } from '@/hooks/useSeasons';
import { ApiError } from '@/types/api';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import type { SeasonSummary } from '@/types/season';
import { colors, radius, spacing } from '@/theme';
import { formatCampusDate } from '@/utils/campus-time';

const FINISHED_FILTER = { status: 'FINISHED' } as const;

function registrationLabel(season: SeasonSummary): string {
    if (season.finished_at) {
        return `Finalizada em ${formatCampusDate(season.finished_at)}`;
    }

    if (season.registration_start_date && season.registration_end_date) {
        return `Inscrições: ${formatCampusDate(season.registration_start_date)} a ${formatCampusDate(season.registration_end_date)}`;
    }

    if (season.registration_end_date) {
        return `Inscrições até ${formatCampusDate(season.registration_end_date)}`;
    }

    return 'Sem prazo de inscrição';
}

const SeasonRow = memo(function SeasonRow({ season }: { season: SeasonSummary }) {
    return (
        <Link href={`/seasons/${season.season_id}`} asChild>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${season.name}, ${season.year}. Abrir detalhes`}
            >
                {({ pressed }) => (
                    <View style={[styles.card, { opacity: pressed ? 0.85 : 1 }]}>
                        <View style={styles.cardTop}>
                            <ThemedText variant="section" numberOfLines={1} style={styles.cardTitle}>
                                {season.name}
                            </ThemedText>
                        </View>
                        <ThemedText variant="bodySm" style={styles.cardSubtitle}>
                            {registrationLabel(season)}
                        </ThemedText>
                        <View style={styles.cardFooter}>
                            <SeasonStatusBadge status={season.status} />
                            <View style={styles.cardFooterRight}>
                                <ThemedText variant="caption" style={styles.year}>
                                    {season.year}
                                </ThemedText>
                                <Icon name="chev_r" size={18} color={colors.textMuted} />
                            </View>
                        </View>
                    </View>
                )}
            </Pressable>
        </Link>
    );
});

export default function SeasonsHistoryScreen() {
    const seasons = useSeasons(FINISHED_FILTER);
    const items = seasons.data ?? [];

    const renderEmpty = () => {
        if (seasons.isPending) {
            return <LoadingState label="Carregando temporadas…" />;
        }

        if (seasons.isError) {
            if (seasons.error instanceof ApiError && seasons.error.status === 403) {
                return (
                    <ErrorState
                        title="Sem permissão"
                        description="Esta área é exclusiva para monitores e administradores."
                    />
                );
            }

            return (
                <ErrorState
                    title="Não foi possível carregar as temporadas"
                    description={friendlyErrorMessage(seasons.error, 'Tente de novo.')}
                    onRetry={() => seasons.refetch()}
                    retrying={seasons.isRefetching}
                />
            );
        }

        return (
            <EmptyState
                title="Nenhuma temporada anterior"
                description="As temporadas finalizadas aparecem aqui, somente para consulta."
            />
        );
    };

    const renderItem = useCallback(
        ({ item }: ListRenderItemInfo<SeasonSummary>) => <SeasonRow season={item} />,
        []
    );

    return (
        <FlatList
            data={items}
            keyExtractor={(item) => item.season_id}
            renderItem={renderItem}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[styles.content, items.length === 0 && styles.fill]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={renderEmpty}
            refreshControl={<RefreshControl refreshing={seasons.isRefetching} onRefresh={() => seasons.refetch()} />}
        />
    );
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xl,
    },
    fill: {
        flexGrow: 1,
    },
    separator: {
        height: spacing.sm,
    },
    card: {
        gap: spacing.xs,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    cardTitle: {
        flex: 1,
    },
    cardSubtitle: {
        color: colors.textSecondary,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.xs,
    },
    cardFooterRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    year: {
        color: colors.textMuted,
    },
});
