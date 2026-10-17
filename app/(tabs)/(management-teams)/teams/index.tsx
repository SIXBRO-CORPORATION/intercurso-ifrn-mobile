import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { FilterChips, type FilterChipOption } from '@/components/filter-chips';
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

const STATUS_ORDER: TeamStatus[] = ['SUBMITTED', 'APPROVED', 'REJECTED', 'DRAFT'];

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

function TeamRow({ team }: { team: TeamSummary }) {
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
}

function TeamsManagementContent({ defaultSeasonId }: { defaultSeasonId: string }) {
    const seasons = useSeasons();
    const [status, setStatus] = useState<StatusFilter>('SUBMITTED');
    const [seasonId, setSeasonId] = useState<string>(defaultSeasonId);

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

    const statusOptionsWithCount = useMemo(
        () =>
            STATUS_OPTIONS.map((option) =>
                option.value === status ? { ...option, label: `${option.label} · ${items.length}` } : option
            ),
        [items.length, status]
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.titleBlock}>
                <ThemedText variant="largeTitle">Equipes</ThemedText>
                <ThemedText variant="body" style={styles.titleSubtitle}>
                    Gerenciamento
                </ThemedText>
            </View>

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
                    {items.length} {items.length === 1 ? 'equipe' : 'equipes'} {STATUS_COUNT_LABEL[status]}
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

        return (
            <EmptyState
                title={`Nenhuma equipe ${STATUS_COUNT_LABEL[status]}`}
                description="Troque o status ou a temporada para ver outras equipes."
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
    titleBlock: {
        paddingHorizontal: spacing.md,
        gap: 2,
    },
    titleSubtitle: {
        color: colors.textSecondary,
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
