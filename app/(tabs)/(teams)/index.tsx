import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Button } from '@/components/button';
import { LoginPrompt } from '@/components/auth/login-prompt';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { TeamStatusBadge } from '@/components/teams/team-status-badge';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useActiveSeason } from '@/hooks/useSeasons';
import { useTeams } from '@/hooks/useTeams';
import type { TeamSummary } from '@/types/team';
import { colors, radius, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { isMonitorOrAbove } from '@/utils/permissions';

function TeamRow({ team, isOwner }: { team: TeamSummary; isOwner: boolean }) {
    const subtitle = [team.modality_name, `${team.members_count} ${team.members_count === 1 ? 'membro' : 'membros'}`]
        .filter(Boolean)
        .join(' · ');

    return (
        <Link href={`/team/${team.team_id}`} asChild>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${team.name}, ${subtitle}${isOwner ? ', você é o dono' : ''}. Abrir time`}
            >
                {({ pressed }) => (
                    <View style={[styles.row, { opacity: pressed ? 0.7 : 1 }]}>
                        <View style={styles.texts}>
                            <ThemedText variant="headline" numberOfLines={1}>
                                {team.name}
                            </ThemedText>
                            <ThemedText variant="subhead">{subtitle}</ThemedText>
                            {isOwner ? <ThemedText variant="caption">Você é o dono</ThemedText> : null}
                        </View>
                        <TeamStatusBadge status={team.status} />
                        <ThemedText variant="title" style={styles.chevron}>
                            ›
                        </ThemedText>
                    </View>
                )}
            </Pressable>
        </Link>
    );
}

function registrationBlockedReason(status: string | undefined, hasSeason: boolean): string | null {
    if (!hasSeason) return 'Não há período de inscrições aberto no momento.';
    if (status !== 'REGISTRATION_OPEN') return 'Período de inscrições encerrado. Aguarde a próxima temporada.';
    return null;
}

export default function TeamsScreen() {
    const { user, isAuthenticated, isInitializing } = useAuth();
    const teams = useTeams();
    const activeSeason = useActiveSeason();

    if (isInitializing) {
        return <LoadingState label="Carregando…" />;
    }

    if (!isAuthenticated || !user) {
        return <LoginPrompt message="Entre com sua conta SUAP para ver, criar e entrar em times." />;
    }

    const blockedReason = activeSeason.isPending
        ? null
        : registrationBlockedReason(activeSeason.data?.status, !!activeSeason.data);
    const items = teams.data ?? [];
    const isStaff = isMonitorOrAbove(user);

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.actions}>
                <Button
                    title="Criar time"
                    disabled={activeSeason.isPending || blockedReason !== null}
                    onPress={() => router.push('/team/new')}
                    style={styles.action}
                />
                <Button
                    title="Entrar com código"
                    variant="secondary"
                    onPress={() => router.push('/join')}
                    style={styles.action}
                />
            </View>
            {blockedReason ? <ThemedText variant="caption">{blockedReason}</ThemedText> : null}
            {isStaff ? (
                <ThemedText variant="caption">
                    Como monitor, esta lista mostra todos os times. A aprovação fica na aba Gestão.
                </ThemedText>
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
                title="Você ainda não está em nenhum time"
                description="Crie um time ou entre em um com o código de convite."
            />
        );
    };

    return (
        <FlatList
            data={items}
            keyExtractor={(item) => item.team_id}
            renderItem={({ item }) => <TeamRow team={item} isOwner={item.owner_id === user.user_id} />}
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
    header: {
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    action: {
        flex: 1,
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
    chevron: {
        color: colors.secondaryLabel as string,
    },
});
