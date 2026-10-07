import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { FilterChips, type FilterChipOption } from '@/components/filter-chips';
import { ManagementGuard } from '@/components/management/management-guard';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { Pill } from '@/components/teams/pill';
import { TeamAvatar } from '@/components/teams/team-avatar';
import { ThemedText } from '@/components/themed-text';
import { useActiveSeason, useSeasons } from '@/hooks/useSeasons';
import { useTeams } from '@/hooks/useTeams';
import { TeamStatusLabel, type TeamStatus } from '@/types/enums';
import type { TeamSummary } from '@/types/team';
import { colors, radius, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { formatCampusDateTime } from '@/utils/campus-time';

const ALL = 'all';

const STATUS_ORDER: TeamStatus[] = ['SUBMITTED', 'APPROVED', 'REJECTED', 'DRAFT'];

const STATUS_OPTIONS: FilterChipOption<TeamStatus>[] = STATUS_ORDER.map((value) => ({
    value,
    label: TeamStatusLabel[value],
}));

function TeamRow({ team }: { team: TeamSummary }) {
    const donations = `${team.donations_confirmed}/${team.donations_total}`;
    const readyToApprove =
        team.status === 'SUBMITTED' && team.donations_total > 0 && team.donations_confirmed === team.donations_total;
    const subtitle = [team.modality_name, team.owner_name ? `Dono: ${team.owner_name}` : null, `${team.members_count} membros`]
        .filter(Boolean)
        .join(' · ');

    return (
        <Link href={`/teams/${team.team_id}`} asChild>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${team.name}, ${subtitle}, doações ${donations}${readyToApprove ? ', pronto para aprovar' : ''}. Abrir`}
            >
                {({ pressed }) => (
                    <View style={[styles.row, { opacity: pressed ? 0.7 : 1 }]}>
                        <TeamAvatar name={team.name} photo={team.photo} />
                        <View style={styles.texts}>
                            <ThemedText variant="headline" numberOfLines={1}>
                                {team.name}
                            </ThemedText>
                            <ThemedText variant="subhead">{subtitle}</ThemedText>
                            {team.submmited_at ? (
                                <ThemedText variant="caption">Submetido em {formatCampusDateTime(team.submmited_at)}</ThemedText>
                            ) : null}
                            <View style={styles.pills}>
                                <Pill label={`DOAÇÕES ${donations}`} tone={readyToApprove ? 'filled' : 'neutral'} />
                                {readyToApprove ? <Pill label="PRONTO PARA APROVAR" tone="outline" /> : null}
                            </View>
                        </View>
                        <ThemedText variant="title" style={styles.chevron}>
                            ›
                        </ThemedText>
                    </View>
                )}
            </Pressable>
        </Link>
    );
}

function TeamsManagementContent({ defaultSeasonId }: { defaultSeasonId: string }) {
    const seasons = useSeasons();
    const [status, setStatus] = useState<TeamStatus>('SUBMITTED');
    const [seasonId, setSeasonId] = useState<string>(defaultSeasonId);

    const teams = useTeams({ status, season_id: seasonId === ALL ? undefined : seasonId });

    const seasonOptions: FilterChipOption<string>[] = useMemo(
        () => [
            { value: ALL, label: 'Todas as temporadas' },
            ...(seasons.data ?? []).map((season) => ({ value: season.season_id, label: `${season.name}` })),
        ],
        [seasons.data]
    );

    const items = useMemo(() => {
        const list = [...(teams.data ?? [])];
        return list.sort((a, b) => {
            const aDate = a.submmited_at ? Date.parse(a.submmited_at) : Number.MAX_SAFE_INTEGER;
            const bDate = b.submmited_at ? Date.parse(b.submmited_at) : Number.MAX_SAFE_INTEGER;
            return aDate - bDate || a.name.localeCompare(b.name);
        });
    }, [teams.data]);

    const renderHeader = () => (
        <View style={styles.filters}>
            <FilterChips
                accessibilityLabel="Filtrar por status"
                options={STATUS_OPTIONS}
                selected={status}
                onSelect={setStatus}
            />
            {seasons.data ? (
                <FilterChips
                    accessibilityLabel="Filtrar por temporada"
                    options={seasonOptions}
                    selected={seasonId}
                    onSelect={setSeasonId}
                />
            ) : null}
        </View>
    );

    const renderEmpty = () => {
        if (teams.isPending) {
            return <LoadingState label="Carregando times…" />;
        }

        if (teams.isError) {
            return (
                <ErrorState
                    title="Não foi possível carregar os times"
                    description={friendlyErrorMessage(teams.error, 'Tente de novo.')}
                    onRetry={() => teams.refetch()}
                    retrying={teams.isRefetching}
                />
            );
        }

        return (
            <EmptyState
                title={`Nenhum time: ${TeamStatusLabel[status].toLowerCase()}`}
                description="Troque o status ou a temporada para ver outros times."
            />
        );
    };

    return (
        <FlatList
            data={items}
            keyExtractor={(item) => item.team_id}
            renderItem={({ item }) => <TeamRow team={item} />}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[styles.content, items.length === 0 && styles.fill]}
            ListHeaderComponent={renderHeader}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={renderEmpty}
            refreshControl={<RefreshControl refreshing={teams.isRefetching} onRefresh={() => teams.refetch()} />}
        />
    );
}

function TeamsManagementGate() {
    const activeSeason = useActiveSeason();

    if (activeSeason.isPending) {
        return <LoadingState label="Carregando…" />;
    }

    return <TeamsManagementContent defaultSeasonId={activeSeason.data?.season_id ?? ALL} />;
}

export default function TeamsManagementScreen() {
    return (
        <ManagementGuard>
            <TeamsManagementGate />
        </ManagementGuard>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingTop: spacing.sm,
        paddingBottom: spacing.xl,
    },
    fill: {
        flexGrow: 1,
    },
    filters: {
        gap: spacing.sm,
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
    pills: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginTop: spacing.xs,
    },
    chevron: {
        color: colors.secondaryLabel as string,
    },
});
