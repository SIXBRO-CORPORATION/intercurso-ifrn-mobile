import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/button';
import { InfoRow, Section } from '@/components/management/section';
import { ManagementGuard } from '@/components/management/management-guard';
import { ErrorState, LoadingState } from '@/components/states/screen-states';
import { MemberCard, type MemberAction } from '@/components/teams/member-card';
import { TeamStatusBadge } from '@/components/teams/team-status-badge';
import { ThemedText } from '@/components/themed-text';
import { useApproveTeam, useConfirmDonation, useRemoveTeamMember, useTeamDetails } from '@/hooks/useTeams';
import { useToast } from '@/providers/ToastProvider';
import type { TeamStatus } from '@/types/enums';
import type { TeamMember } from '@/types/team';
import { spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { formatCampusDateTime } from '@/utils/campus-time';

const STATUS_COPY: Record<TeamStatus, string> = {
    DRAFT: 'Em rascunho: o dono ainda está montando o time. Ainda não há o que aprovar.',
    SUBMITTED: 'Aguardando aprovação. Confirme a doação de cada integrante e depois aprove o time.',
    APPROVED: 'Time aprovado e liberado para competir.',
    REJECTED: 'Time rejeitado.',
};

function plural(count: number, one: string, many: string): string {
    return `${count} ${count === 1 ? one : many}`;
}

function TeamManagementContent({ teamId }: { teamId: string }) {
    const toast = useToast();
    const details = useTeamDetails(teamId);
    const confirmDonation = useConfirmDonation();
    const approveTeam = useApproveTeam();
    const removeMember = useRemoveTeamMember();

    if (details.isPending) {
        return <LoadingState label="Carregando time…" />;
    }

    if (details.isError) {
        return (
            <ErrorState
                title="Não foi possível carregar o time"
                description={friendlyErrorMessage(details.error, 'Tente de novo.')}
                onRetry={() => details.refetch()}
                retrying={details.isRefetching}
            />
        );
    }

    const team = details.data;
    const pending = team.members.filter((member) => member.donation_status === 'PENDING_DONATION');
    const canConfirmDonations = team.status === 'SUBMITTED' || team.status === 'APPROVED';
    const canApprove = team.status === 'SUBMITTED' && pending.length === 0 && team.members.length > 0;

    let approveHint: string | null = null;
    if (team.status === 'SUBMITTED' && pending.length > 0) {
        approveHint = `Faltam ${plural(pending.length, 'doação', 'doações')} para poder aprovar.`;
    }

    const run = async (action: () => Promise<unknown>, success: string, fallback: string) => {
        try {
            await action();
            toast.success(success);
        } catch (error) {
            toast.error(friendlyErrorMessage(error, fallback));
        }
    };

    const askConfirmDonation = (member: TeamMember) =>
        Alert.alert('Confirmar doação?', `Confirmar a doação de ${member.name}? Não é possível desfazer.`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Confirmar',
                onPress: () =>
                    run(
                        () => confirmDonation.mutateAsync({ teamId: team.team_id, userId: member.user_id }),
                        pending.length === 1
                            ? 'Todas as doações confirmadas. O time já pode ser aprovado.'
                            : `Doação de ${member.name} confirmada.`,
                        'Não foi possível confirmar a doação.'
                    ),
            },
        ]);

    const askApprove = () =>
        Alert.alert('Aprovar time?', `"${team.name}" será liberado para competir.`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Aprovar',
                onPress: () =>
                    run(
                        () => approveTeam.mutateAsync({ teamId: team.team_id }),
                        'Time aprovado.',
                        'Não foi possível aprovar o time.'
                    ),
            },
        ]);

    const askRemove = (member: TeamMember) =>
        Alert.alert(
            'Remover do time?',
            `${member.name} será removido(a) de "${team.name}". Como monitor, você pode fazer isso em qualquer status.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Remover',
                    style: 'destructive',
                    onPress: () =>
                        run(
                            () => removeMember.mutateAsync({ teamId: team.team_id, userId: member.user_id }),
                            `${member.name} foi removido(a).`,
                            'Não foi possível remover o integrante.'
                        ),
                },
            ]
        );

    return (
        <>
            <Stack.Screen options={{ title: team.name }} />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={details.isRefetching} onRefresh={() => details.refetch()} />}
            >
                <View style={styles.hero}>
                    <ThemedText variant="title" selectable>
                        {team.name}
                    </ThemedText>
                    <ThemedText variant="subhead">
                        {team.modality_name ?? 'Modalidade'}
                        {team.owner_name ? ` · Dono: ${team.owner_name}` : ''}
                    </ThemedText>
                    <TeamStatusBadge status={team.status} />
                    <ThemedText variant="subhead">{STATUS_COPY[team.status]}</ThemedText>
                </View>

                <Section title="Doações">
                    <InfoRow label="Confirmadas" value={`${team.donations_confirmed} de ${team.donations_total}`} />
                    {team.submmited_at ? (
                        <InfoRow label="Submetido em" value={formatCampusDateTime(team.submmited_at)} />
                    ) : null}
                    {team.approved_at ? (
                        <InfoRow label="Aprovado em" value={formatCampusDateTime(team.approved_at)} />
                    ) : null}
                    {team.rejected_at ? (
                        <InfoRow label="Rejeitado em" value={formatCampusDateTime(team.rejected_at)} />
                    ) : null}
                </Section>

                <Section title="Integrantes">
                    {team.members.map((member, index) => {
                        const isOwner = member.user_id === team.owner_id;
                        const actions: MemberAction[] = [
                            ...(canConfirmDonations && member.donation_status === 'PENDING_DONATION'
                                ? [{ label: 'Confirmar doação', onPress: () => askConfirmDonation(member) }]
                                : []),
                            ...(isOwner
                                ? []
                                : [{ label: 'Remover', destructive: true, onPress: () => askRemove(member) }]),
                        ];

                        return (
                            <MemberCard
                                key={member.user_id}
                                name={member.name}
                                subtitle={`Matrícula ${member.matricula}`}
                                isOwner={isOwner}
                                isCaptain={member.user_id === team.captain_id || member.role === 'CAPTAIN'}
                                donation={team.status === 'DRAFT' ? undefined : member.donation_status}
                                actions={actions}
                                divider={index > 0}
                            />
                        );
                    })}
                </Section>

                {team.status === 'SUBMITTED' ? (
                    <View style={styles.actions}>
                        {approveHint ? <ThemedText variant="caption">{approveHint}</ThemedText> : null}
                        <Button
                            title="Aprovar time"
                            disabled={!canApprove}
                            loading={approveTeam.isPending}
                            onPress={askApprove}
                        />
                    </View>
                ) : null}
            </ScrollView>
        </>
    );
}

export default function TeamManagementScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <ManagementGuard>
            <TeamManagementContent teamId={id} />
        </ManagementGuard>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.md,
    },
    hero: {
        gap: spacing.xs,
    },
    actions: {
        gap: spacing.xs,
    },
});
