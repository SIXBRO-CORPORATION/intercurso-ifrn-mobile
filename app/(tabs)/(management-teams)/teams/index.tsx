import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, type ListRenderItemInfo, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { FilterChips, type FilterChipOption } from '@/components/filter-chips';
import { Icon } from '@/components/icon';
import { ManagementGuard } from '@/components/management/management-guard';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { TeamAvatar } from '@/components/teams/team-avatar';
import { ThemedText } from '@/components/themed-text';
import { useActiveSeason, useSeasons } from '@/hooks/useSeasons';
import { useTeams } from '@/hooks/useTeams';
import { type TeamStatus } from '@/types/enums';
import type { TeamSummary } from '@/types/team';
import { colors, fontFamily, radius, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';

const ALL = 'all';

type StatusFilter = 'all' | TeamStatus;

const STATUS_ORDER: TeamStatus[] = ['SUBMITTED', 'APPROVED', 'REJECTED'];

const STATUS_FILTER_LABEL: Record<TeamStatus, string> = {
    SUBMITTED: 'Pendentes',
    APPROVED: 'Aprovadas',
    REJECTED: 'Rejeitadas',
    DRAFT: 'Rascunho',
};

const STATUS_COUNT_LABEL: Record<StatusFilter, string> = {
    all: 'cadastradas',
    SUBMITTED: 'aguardando aprovação',
    APPROVED: 'aprovadas',
    REJECTED: 'rejeitadas',
    DRAFT: 'em rascunho',
};

const STATUS_TONE: Record<TeamStatus, { background: string; foreground: string; label: string }> = {
    DRAFT: { background: colors.field, foreground: colors.textSecondary, label: 'Rascunho' },
    SUBMITTED: { background: colors.warningSoft, foreground: colors.warningText, label: 'Pendente' },
    APPROVED: { background: colors.primarySoft, foreground: colors.primaryDark, label: 'Aprovado' },
    REJECTED: { background: colors.dangerSoft, foreground: colors.danger, label: 'Rejeitado' },
};

const STATUS_OPTIONS: FilterChipOption<StatusFilter>[] = [
    { value: ALL, label: 'Todas' },
    ...STATUS_ORDER.map((value) => ({ value, label: STATUS_FILTER_LABEL[value] })),
];

function StatusPill({ status }: { status: TeamStatus }) {
    const tone = STATUS_TONE[status];
    return (
        <View style={[styles.statusPill, { backgroundColor: tone.background }]}>
            <ThemedText variant="caption" style={[styles.statusPillLabel, { color: tone.foreground }]}>
                {tone.label}
            </ThemedText>
        </View>
    );
}

function DonationProgress({ confirmed, total }: { confirmed: number; total: number }) {
    const complete = confirmed >= total;
    const percent = total > 0 ? Math.min(100, Math.round((confirmed / total) * 100)) : 0;
    const tone = complete ? colors.primary : colors.warning;
    const toneText = complete ? colors.primaryDark : colors.warningText;

    return (
        <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: tone }]} />
            </View>
            <ThemedText variant="label" style={[styles.progressLabel, { color: toneText }]}>
                {confirmed}/{total} doações
            </ThemedText>
        </View>
    );
}

const TeamRow = memo(function TeamRow({ team }: { team: TeamSummary }) {
    const subtitle = team.modality_name ?? 'Modalidade';
    const ownerLine = [team.owner_name ? `Dono: ${team.owner_name}` : null, `${team.members_count} membros`]
        .filter(Boolean)
        .join(' · ');

    return (
        <Link href={`/teams/${team.team_id}`} asChild>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${team.name}, ${subtitle}, ${STATUS_TONE[team.status].label}. Abrir`}
            >
                {({ pressed }) => (
                    <View style={[styles.card, { opacity: pressed ? 0.85 : 1 }]}>
                        <View style={styles.cardTop}>
                            <TeamAvatar name={team.name} photo={team.photo} size={48} />
                            <View style={styles.cardTexts}>
                                <ThemedText variant="section" numberOfLines={1}>
                                    {team.name}
                                </ThemedText>
                                <ThemedText variant="bodySm" style={styles.modalityText} numberOfLines={1}>
                                    {subtitle}
                                </ThemedText>
                            </View>
                            <StatusPill status={team.status} />
                        </View>

                        <ThemedText variant="bodySm" style={styles.ownerLine} numberOfLines={1}>
                            {ownerLine}
                        </ThemedText>

                        {team.donations_total > 0 ? (
                            <DonationProgress confirmed={team.donations_confirmed} total={team.donations_total} />
                        ) : null}
                    </View>
                )}
            </Pressable>
        </Link>
    );
});

function TeamsManagementContent({ defaultSeasonId }: { defaultSeasonId: string }) {
    const seasons = useSeasons();
    const [status, setStatus] = useState<StatusFilter>('SUBMITTED');
    const [seasonId, setSeasonId] = useState<string>(defaultSeasonId);
    const [searchOpen, setSearchOpen] = useState(false);
    const [search, setSearch] = useState('');

    const teams = useTeams({
        status: status === ALL ? undefined : status,
        season_id: seasonId === ALL ? undefined : seasonId,
    });

    const seasonOptions: FilterChipOption<string>[] = useMemo(
        () => [
            { value: ALL, label: 'Todas as temporadas' },
            ...(seasons.data ?? []).map((season) => ({ value: season.season_id, label: season.name })),
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

    const query = search.trim().toLowerCase();
    const visibleItems = useMemo(
        () => (query ? items.filter((team) => team.name.toLowerCase().includes(query)) : items),
        [items, query]
    );

    const statusOptionsWithCount = useMemo(
        () =>
            STATUS_OPTIONS.map((option) =>
                option.value === status ? { ...option, label: `${option.label} · ${items.length}` } : option
            ),
        [items.length, status]
    );

    const toggleSearch = () => {
        setSearchOpen((open) => !open);
        setSearch('');
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.titleRow}>
                <View style={styles.titleBlock}>
                    <ThemedText variant="largeTitle">Equipes</ThemedText>
                    <ThemedText variant="body" style={styles.titleSubtitle}>
                        Gerenciamento
                    </ThemedText>
                </View>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={searchOpen ? 'Fechar busca' : 'Buscar equipe'}
                    onPress={toggleSearch}
                    style={({ pressed }) => [styles.searchButton, { opacity: pressed ? 0.7 : 1 }]}
                >
                    <Icon name={searchOpen ? 'close' : 'search'} size={18} color={colors.ink} />
                </Pressable>
            </View>

            {searchOpen ? (
                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    autoFocus
                    placeholder="Buscar equipe pelo nome"
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel="Buscar equipe pelo nome"
                    style={styles.searchInput}
                />
            ) : null}

            <View style={styles.filters}>
                <FilterChips
                    accessibilityLabel="Filtrar por status"
                    options={statusOptionsWithCount}
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

            {!teams.isPending && !teams.isError ? (
                <ThemedText variant="bodySm" style={styles.countLine}>
                    {visibleItems.length} {visibleItems.length === 1 ? 'equipe' : 'equipes'}{' '}
                    {query ? `encontrada${visibleItems.length === 1 ? '' : 's'} para "${search.trim()}"` : STATUS_COUNT_LABEL[status]}
                </ThemedText>
            ) : null}
        </View>
    );

    const renderEmpty = () => {
        if (teams.isPending) {
            return <LoadingState label="Carregando equipes…" />;
        }

        if (teams.isError) {
            return (
                <ErrorState
                    title="Não foi possível carregar as equipes"
                    description={friendlyErrorMessage(teams.error, 'Tente de novo.')}
                    onRetry={() => teams.refetch()}
                    retrying={teams.isRefetching}
                />
            );
        }

        if (query) {
            return (
                <EmptyState
                    title="Nenhuma equipe encontrada"
                    description={`Nenhum resultado para "${search.trim()}". Tente outro nome.`}
                />
            );
        }

        return (
            <EmptyState
                title={`Nenhuma equipe ${STATUS_COUNT_LABEL[status]}`}
                description="Troque o status ou a temporada para ver outras equipes."
            />
        );
    };

    const renderItem = useCallback(
        ({ item }: ListRenderItemInfo<TeamSummary>) => <TeamRow team={item} />,
        []
    );

    return (
        <FlatList
            data={visibleItems}
            keyExtractor={(item) => item.team_id}
            renderItem={renderItem}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[styles.content, visibleItems.length === 0 && styles.fill]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListHeaderComponent={renderHeader}
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
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
    },
    fill: {
        flexGrow: 1,
    },
    header: {
        gap: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        marginHorizontal: -spacing.md,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
    },
    titleBlock: {
        gap: 2,
    },
    titleSubtitle: {
        color: colors.textSecondary,
    },
    searchButton: {
        width: 40,
        height: 40,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.field,
    },
    searchInput: {
        marginHorizontal: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
        color: colors.ink,
    },
    filters: {
        gap: spacing.sm,
    },
    countLine: {
        paddingHorizontal: spacing.md,
        color: colors.textSecondary,
    },
    separator: {
        height: spacing.sm,
    },
    card: {
        gap: spacing.sm,
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
        gap: spacing.sm,
    },
    cardTexts: {
        flex: 1,
        gap: 2,
    },
    modalityText: {
        color: colors.textSecondary,
    },
    statusPill: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.pill,
        borderCurve: 'continuous',
    },
    statusPillLabel: {
        fontFamily: fontFamily.bold,
    },
    ownerLine: {
        color: colors.textSecondary,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    progressTrack: {
        flex: 1,
        height: 8,
        borderRadius: radius.pill,
        backgroundColor: colors.border,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: radius.pill,
    },
    progressLabel: {
        fontFamily: fontFamily.bold,
    },
});
