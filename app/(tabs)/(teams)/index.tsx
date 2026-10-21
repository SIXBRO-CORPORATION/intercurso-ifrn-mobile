import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { Button } from '@/components/button';
import { LoginPrompt } from '@/components/auth/login-prompt';
import { Icon } from '@/components/icon';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { TeamStatusBadge } from '@/components/teams/team-status-badge';
import { TeamAvatar } from '@/components/teams/team-avatar';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useActiveSeason } from '@/hooks/useSeasons';
import { useTeams } from '@/hooks/useTeams';
import type { TeamSummary } from '@/types/team';
import { TeamMemberRoleLabel } from '@/types/enums';
import type { SeasonSummary } from '@/types/season';
import { colors, radius, shadows, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { formatCampusShortDate, formatCampusTime } from '@/utils/campus-time';
import { isMonitorOrAbove } from '@/utils/permissions';

function roleLabel(team: TeamSummary, userId: string): string {
    if (team.owner_id === userId) return TeamMemberRoleLabel.OWNER;
    if (team.captain_id === userId) return TeamMemberRoleLabel.CAPTAIN;
    return TeamMemberRoleLabel.MEMBER;
}

function membersLabel(count: number, max: number | null | undefined): string {
    if (max != null) return `${count}/${max} membros`;
    return `${count} ${count === 1 ? 'membro' : 'membros'}`;
}

function registrationBlockedReason(status: string | undefined, hasSeason: boolean): string | null {
    if (!hasSeason) return 'Não há período de inscrições aberto no momento.';
    if (status !== 'REGISTRATION_OPEN') return 'Período de inscrições encerrado. Aguarde a próxima temporada.';
    return null;
}

function RegistrationBanner({
    season,
    blockedReason,
}: {
    season: SeasonSummary | undefined;
    blockedReason: string | null;
}) {
    if (blockedReason) {
        return (
            <View style={[styles.banner, styles.bannerNeutral]}>
                <View style={[styles.bannerIcon, styles.bannerIconNeutral]}>
                    <Icon name="lock" size={20} color={colors.textSecondary} />
                </View>
                <ThemedText variant="bodySm" style={styles.bannerTextNeutral}>
                    {blockedReason}
                </ThemedText>
            </View>
        );
    }

    if (!season?.registration_end_date) return null;

    return (
        <View style={[styles.banner, styles.bannerOpen]}>
            <View style={[styles.bannerIcon, styles.bannerIconOpen]}>
                <Icon name="clock" size={20} color={colors.surface} />
            </View>
            <View style={styles.bannerTexts}>
                <ThemedText variant="section">Inscrições abertas</ThemedText>
                <ThemedText variant="bodySm" style={styles.bannerSubtitle}>
                    até {formatCampusShortDate(season.registration_end_date)} às{' '}
                    {formatCampusTime(season.registration_end_date)}
                </ThemedText>
            </View>
        </View>
    );
}

function TeamCard({ team, role }: { team: TeamSummary; role: string }) {
    const maxMembers = team.max_members;
    const subtitle = [team.modality_name, role].filter(Boolean).join(' · ');

    return (
        <Link href={`/team/${team.team_id}`} asChild>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${team.name}, ${subtitle}, ${membersLabel(team.members_count, maxMembers)}. Abrir equipe`}
            >
                {({ pressed }) => (
                    <View style={[styles.card, { opacity: pressed ? 0.85 : 1 }]}>
                        <View style={styles.cardTop}>
                            <TeamAvatar name={team.name} photo={team.photo} />
                            <View style={styles.cardTexts}>
                                <ThemedText variant="section" numberOfLines={1}>
                                    {team.name}
                                </ThemedText>
                                <ThemedText variant="bodySm" style={styles.muted} numberOfLines={1}>
                                    {subtitle}
                                </ThemedText>
                            </View>
                            <Icon name="chev_r" size={20} color={colors.textMuted} />
                        </View>
                        <View style={styles.cardBottom}>
                            <TeamStatusBadge status={team.status} />
                            <View style={styles.membersRow}>
                                <Icon name="users" size={16} color={colors.textSecondary} />
                                <ThemedText variant="label" style={styles.muted}>
                                    {membersLabel(team.members_count, maxMembers)}
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                )}
            </Pressable>
        </Link>
    );
}

export default function TeamsScreen() {
    const insets = useSafeAreaInsets();
    const { user, isAuthenticated, isInitializing } = useAuth();
    const activeSeason = useActiveSeason();
    const teams = useTeams(activeSeason.data ? { season_id: activeSeason.data.season_id } : undefined);

    if (isInitializing) {
        return <LoadingState label="Carregando…" />;
    }

    if (!isAuthenticated || !user) {
        return <LoginPrompt message="Entre com sua conta SUAP para ver, criar e entrar em equipes." />;
    }

    const blockedReason = activeSeason.isPending
        ? null
        : registrationBlockedReason(activeSeason.data?.status, !!activeSeason.data);
    const items = teams.data ?? [];
    const isStaff = isMonitorOrAbove(user);
    const canCreate = !activeSeason.isPending && blockedReason === null;

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerRow}>
                <View style={styles.titleBlock}>
                    <ThemedText variant="largeTitle">Equipes</ThemedText>
                    <ThemedText variant="body" style={styles.titleSubtitle}>
                        Minhas equipes
                    </ThemedText>
                </View>
                <View style={styles.bellButton}>
                    <Icon name="bell" size={20} color={colors.ink} />
                </View>
            </View>

            <RegistrationBanner season={activeSeason.data} blockedReason={blockedReason} />

            <View style={styles.sectionRow}>
                <ThemedText variant="heading">
                    {items.length} {items.length === 1 ? 'equipe' : 'equipes'}
                </ThemedText>
            </View>

            {isStaff ? (
                <ThemedText variant="caption">
                    Como monitor, esta lista mostra todas as equipes. A aprovação fica na aba Gestão.
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
                title="Você ainda não está em nenhuma equipe"
                description="Crie uma equipe ou entre em uma com o link de convite que você recebeu."
            />
        );
    };

    return (
        <View style={styles.screen}>
            <FlatList
                style={styles.list}
                data={items}
                keyExtractor={(item) => item.team_id}
                renderItem={({ item }) => <TeamCard team={item} role={roleLabel(item, user.user_id)} />}
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={[styles.content, items.length === 0 && styles.fill]}
                ListHeaderComponent={renderHeader}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={teams.isRefetching}
                        onRefresh={() => {
                            teams.refetch();
                            activeSeason.refetch();
                        }}
                    />
                }
            />

            <View style={[styles.actionsBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
                <Button
                    title="Criar equipe"
                    icon="plus"
                    disabled={!canCreate}
                    onPress={() => router.push('/team/new')}
                />
                <Button
                    title="Entrar com código"
                    icon="link"
                    variant="outline"
                    disabled={!canCreate}
                    onPress={() => router.push('/join')}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    list: {
        flex: 1,
    },
    content: {
        paddingBottom: spacing.xl,
    },
    fill: {
        flexGrow: 1,
    },
    header: {
        gap: spacing.md,
        paddingTop: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    titleBlock: {
        gap: 2,
    },
    titleSubtitle: {
        color: colors.textSecondary,
    },
    bellButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.field,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
    },
    bannerOpen: {
        backgroundColor: colors.primarySoft,
    },
    bannerNeutral: {
        backgroundColor: colors.field,
    },
    bannerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerIconOpen: {
        backgroundColor: colors.primary,
    },
    bannerIconNeutral: {
        backgroundColor: colors.border,
    },
    bannerTexts: {
        flex: 1,
        gap: 2,
    },
    bannerSubtitle: {
        color: colors.textSecondary,
    },
    bannerTextNeutral: {
        flex: 1,
        color: colors.textSecondary,
    },
    sectionRow: {
        paddingTop: spacing.xs,
    },
    separator: {
        height: spacing.sm,
    },
    card: {
        gap: spacing.sm,
        marginHorizontal: spacing.md,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        boxShadow: shadows.card,
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
    cardBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    membersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
    },
    muted: {
        color: colors.textSecondary,
    },
    actionsBar: {
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        backgroundColor: colors.background,
    },
});
