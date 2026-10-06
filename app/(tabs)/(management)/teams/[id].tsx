import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/button';
import { InfoRow, Section } from '@/components/management/section';
import { ManagementGuard } from '@/components/management/management-guard';
import { ErrorState, LoadingState } from '@/components/states/screen-states';
import { MemberCard, type MemberAction } from '@/components/teams/member-card';
import { TeamStatusBadge } from '@/components/teams/team-status-badge';
import { ThemedText } from '@/components/themed-text';
import { useApproveTeam, useConfirmDonation, useRejectTeam, useTeamDetails } from '@/hooks/useTeams';
import { useToast } from '@/providers/ToastProvider';
import type { TeamStatus } from '@/types/enums';
import type { TeamMember } from '@/types/team';
import { colors, radius, spacing, useBrandColors } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { formatCampusDateTime } from '@/utils/campus-time';
import { formatGenderRule, formatMembersRange } from '@/utils/modality-gender';
import { describeMissingQuota, getGenderQuota } from '@/utils/team-gender-quota';

const REJECTION_REASON_MAX = 500;

const STATUS_COPY: Record<TeamStatus, string> = {
    DRAFT: 'Em rascunho: o dono ainda está montando o time. Ainda não há o que aprovar.',
    SUBMITTED: 'Aguardando aprovação. Confirme a doação de cada integrante e depois aprove ou rejeite o time.',
    APPROVED: 'Time aprovado e liberado para competir.',
    REJECTED: 'Time rejeitado.',
};

function plural(count: number, one: string, many: string): string {
    return `${count} ${count === 1 ? one : many}`;
}

function RejectForm({
    teamName,
    loading,
    onConfirm,
    onCancel,
}: {
    teamName: string;
    loading: boolean;
    onConfirm: (reason: string) => void;
    onCancel: () => void;
}) {
    const brand = useBrandColors();
    const [reason, setReason] = useState('');
    const trimmed = reason.trim();

    const ask = () =>
        Alert.alert(
            'Rejeitar time?',
            `"${teamName}" volta para rascunho. O dono poderá corrigir e submeter novamente, e verá o motivo informado.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Rejeitar', style: 'destructive', onPress: () => onConfirm(trimmed) },
            ]
        );

    return (
        <View style={styles.rejectForm}>
            <ThemedText variant="headline">Motivo da rejeição</ThemedText>
            <ThemedText variant="caption">
                Explique o que o dono precisa corrigir. O motivo fica visível para o dono do time.
            </ThemedText>
            <TextInput
                value={reason}
                onChangeText={(value) => setReason(value.slice(0, REJECTION_REASON_MAX))}
                multiline
                placeholder="Ex.: doação de um integrante não foi comprovada"
                placeholderTextColor={colors.secondaryLabel as string}
                accessibilityLabel="Motivo da rejeição"
                style={[styles.input, { color: colors.label as string, borderColor: brand.accent }]}
            />
            <ThemedText variant="caption">
                {trimmed.length}/{REJECTION_REASON_MAX}
            </ThemedText>
            <Button title="Confirmar rejeição" variant="destructive" disabled={!trimmed} loading={loading} onPress={ask} />
            <Button title="Cancelar" variant="ghost" onPress={onCancel} />
        </View>
    );
}

function TeamManagementContent({ teamId }: { teamId: string }) {
    const toast = useToast();
    const details = useTeamDetails(teamId);
    const confirmDonation = useConfirmDonation();
    const approveTeam = useApproveTeam();
    const rejectTeam = useRejectTeam();
    const [rejecting, setRejecting] = useState(false);

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
    const quota = getGenderQuota(team, team.members);
    const quotaMessage = quota && !quota.satisfied ? describeMissingQuota(quota) : null;
    const canApprove =
        team.status === 'SUBMITTED' && pending.length === 0 && team.members.length > 0 && quota?.satisfied !== false;

    let approveHint: string | null = null;
    if (team.status === 'SUBMITTED' && pending.length > 0) {
        approveHint = `Faltam ${plural(pending.length, 'doação', 'doações')} para poder aprovar.`;
    } else if (team.status === 'SUBMITTED' && quotaMessage) {
        approveHint = `${quotaMessage} Não é possível aprovar até que a cota seja atendida.`;
    }

    const membersRange = formatMembersRange(team.min_members, team.max_members);
    const genderRule = team.gender_mode ? formatGenderRule(team) : null;

    const run = async (action: () => Promise<unknown>, success: string, fallback: string) => {
        try {
            await action();
            toast.success(success);
            return true;
        } catch (error) {
            toast.error(friendlyErrorMessage(error, fallback));
            return false;
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

    const handleReject = async (reason: string) => {
        const ok = await run(
            () => rejectTeam.mutateAsync({ teamId: team.team_id, reason }),
            'Time rejeitado e devolvido para rascunho.',
            'Não foi possível rejeitar o time.'
        );
        if (ok) setRejecting(false);
    };

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
                        {genderRule ? ` · ${genderRule}` : ''}
                        {team.owner_name ? ` · Dono: ${team.owner_name}` : ''}
                    </ThemedText>
                    <TeamStatusBadge status={team.status} />
                    <ThemedText variant="subhead">{STATUS_COPY[team.status]}</ThemedText>
                </View>

                {team.status === 'DRAFT' && team.rejection_reason ? (
                    <Section title="Última rejeição">
                        <ThemedText variant="subhead">{team.rejection_reason}</ThemedText>
                        {team.rejected_at ? (
                            <ThemedText variant="caption">Em {formatCampusDateTime(team.rejected_at)}</ThemedText>
                        ) : null}
                    </Section>
                ) : null}

                <Section title="Integrantes">
                    <InfoRow
                        label="Total"
                        value={membersRange ? `${team.members.length} (${membersRange})` : String(team.members.length)}
                    />
                    {quota ? (
                        <ThemedText variant="caption">
                            {quota.satisfied
                                ? `Cota de gênero atendida (${quota.male} homens e ${quota.female} mulheres).`
                                : quotaMessage}
                        </ThemedText>
                    ) : null}
                    {team.members.map((member, index) => {
                        const isOwner = member.user_id === team.owner_id;
                        const actions: MemberAction[] =
                            canConfirmDonations && member.donation_status === 'PENDING_DONATION'
                                ? [{ label: 'Confirmar doação', onPress: () => askConfirmDonation(member) }]
                                : [];

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

                <Section title="Doações">
                    <InfoRow label="Confirmadas" value={`${team.donations_confirmed} de ${team.donations_total}`} />
                    {team.submmited_at ? (
                        <InfoRow label="Submetido em" value={formatCampusDateTime(team.submmited_at)} />
                    ) : null}
                    {team.approved_at ? (
                        <InfoRow label="Aprovado em" value={formatCampusDateTime(team.approved_at)} />
                    ) : null}
                </Section>

                {team.status === 'SUBMITTED' ? (
                    rejecting ? (
                        <RejectForm
                            teamName={team.name}
                            loading={rejectTeam.isPending}
                            onConfirm={handleReject}
                            onCancel={() => setRejecting(false)}
                        />
                    ) : (
                        <View style={styles.actions}>
                            {approveHint ? <ThemedText variant="caption">{approveHint}</ThemedText> : null}
                            <Button
                                title="Aprovar time"
                                disabled={!canApprove}
                                loading={approveTeam.isPending}
                                onPress={askApprove}
                            />
                            <Button title="Rejeitar time" variant="destructive" onPress={() => setRejecting(true)} />
                        </View>
                    )
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
    rejectForm: {
        gap: spacing.xs,
    },
    input: {
        minHeight: 96,
        padding: spacing.sm,
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        textAlignVertical: 'top',
        backgroundColor: colors.systemBackground as string,
    },
});
