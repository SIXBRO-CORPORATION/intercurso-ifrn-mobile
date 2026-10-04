import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { FilterChips, type FilterChipOption } from '@/components/filter-chips';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useSeasons } from '@/hooks/useSeasons';
import { ApiError } from '@/types/api';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { SeasonStatusLabel, type SeasonStatus } from '@/types/enums';
import type { SeasonSummary } from '@/types/season';
import { colors, radius, spacing } from '@/theme';
import { formatCampusShortDate } from '@/utils/campus-time';

type StatusFilter = 'ALL' | SeasonStatus;

const SEASON_STATUSES: SeasonStatus[] = [
    'DRAFT',
    'REGISTRATION_OPEN',
    'REGISTRATION_CLOSED',
    'IN_PROGRESS',
    'FINISHED',
];

const STATUS_OPTIONS: FilterChipOption<StatusFilter>[] = [
    { value: 'ALL', label: 'Todas' },
    ...SEASON_STATUSES.map((status) => ({ value: status, label: SeasonStatusLabel[status] })),
];

function SeasonRow({ season }: { season: SeasonSummary }) {
    const registration = season.registration_end_date
        ? `Inscrições até ${formatCampusShortDate(season.registration_end_date)}`
        : 'Sem prazo de inscrição';

    return (
        <View
            style={styles.row}
            accessible
            accessibilityLabel={`${season.name}, ${season.year}, ${SeasonStatusLabel[season.status]}`}
        >
            <View style={styles.texts}>
                <ThemedText variant="headline" numberOfLines={1}>
                    {season.name}
                </ThemedText>
                <ThemedText variant="subhead">
                    {season.year} · {registration}
                </ThemedText>
            </View>
            <View style={styles.pill}>
                <ThemedText variant="caption">
                    {season.active ? 'Ativa · ' : ''}
                    {SeasonStatusLabel[season.status]}
                </ThemedText>
            </View>
        </View>
    );
}

export default function SeasonsScreen() {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const seasons = useSeasons(statusFilter === 'ALL' ? undefined : { status: statusFilter });
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

        if (statusFilter !== 'ALL') {
            return (
                <EmptyState
                    title="Nenhuma temporada com este status"
                    actionLabel="Ver todas"
                    onAction={() => setStatusFilter('ALL')}
                />
            );
        }

        return (
            <EmptyState
                title="Nenhuma temporada cadastrada"
                description="Crie a primeira temporada para liberar as inscrições."
                actionLabel="Criar temporada"
                onAction={() => router.push('/seasons/create')}
            />
        );
    };

    return (
        <FlatList
            data={items}
            keyExtractor={(item) => item.season_id}
            renderItem={({ item }) => <SeasonRow season={item} />}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[styles.content, items.length === 0 && styles.fill]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListHeaderComponent={
                <View style={styles.header}>
                    <FilterChips
                        accessibilityLabel="Filtrar temporadas por status"
                        options={STATUS_OPTIONS}
                        selected={statusFilter}
                        onSelect={setStatusFilter}
                    />
                </View>
            }
            ListEmptyComponent={renderEmpty}
            refreshControl={<RefreshControl refreshing={seasons.isRefetching} onRefresh={() => seasons.refetch()} />}
        />
    );
}

const styles = StyleSheet.create({
    content: {
        paddingBottom: spacing.xl,
    },
    fill: {
        flexGrow: 1,
    },
    header: {
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    separator: {
        height: spacing.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginHorizontal: spacing.md,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.secondarySystemBackground as string,
    },
    texts: {
        flex: 1,
        gap: 2,
    },
    pill: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.full,
        backgroundColor: colors.separator as string,
    },
});
