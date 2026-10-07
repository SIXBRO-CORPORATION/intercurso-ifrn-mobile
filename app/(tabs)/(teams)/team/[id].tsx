import { useCallback } from 'react';
import { Alert, RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/button';
import { LoginPrompt } from '@/components/auth/login-prompt';
import { InfoRow, Section } from '@/components/management/section';
import { ErrorState, LoadingState } from '@/components/states/screen-states';
import { MemberCard, type MemberAction } from '@/components/teams/member-card';
import { TeamStatusBadge } from '@/components/teams/team-status-badge';
import { TeamAvatar } from '@/components/teams/team-avatar';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useActiveSeason } from '@/hooks/useSeasons';
import {
    useDeleteTeam,
    useLeaveTeam,
    useRegenerateInvite,
    useRemoveTeamMember,
    useSelectCaptain,
    useSubmitTeam,
    useTeamDetails,
} from '@/hooks/useTeams';
import { useToast } from '@/providers/ToastProvider';
import type { TeamStatus } from '@/types/enums';
import type { TeamDetails, TeamMember } from '@/types/team';
import { colors, radius, spacing, useBrandColors } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { formatCampusDateTime } from '@/utils/campus-time';
import { formatGenderRule, formatMembersRange } from '@/utils/modality-gender';
import { describeMissingQuota, getGenderQuota } from '@/utils/team-gender-quota';
import { buildInviteLink } from '@/utils/team-invite';

const STATUS_COPY: Record<TeamStatus, string> = {
    DRAFT: 'O time está em rascunho. Convide os integrantes e submeta para aprovação quando atingir os requisitos da modalidade.',
    SUBMITTED: 'Aguardando aprovação do monitor. O time está travado e a organização confirma a doação de cada integrante.',
    APPROVED: 'Time aprovado e liberado para competir.',
    REJECTED: 'O time foi rejeitado pelo monitor.',
};

function plural(count: number, one: string, many: string): string {
    return `${count} ${count === 1 ? one : many}`;
}

function RejectionNotice({ team }: { team: TeamDetails }) {
    const brand = useBrandColors();

    if (team.status !== 'DRAFT' || !team.rejection_reason) return null;

    return (
        <View style={[styles.notice, { borderColor: brand.accent }]} accessibilityRole="alert">
            <ThemedText variant="headline">Devolvido para rascunho pelo monitor</ThemedText>
            <ThemedText variant="subhead">{team.rejection_reason}</ThemedText>
            {team.rejected_at ? (
                <ThemedText variant="caption">Em {formatCampusDateTime(team.rejected_at)}</ThemedText>
            ) : null}
            <ThemedText variant="caption">Corrija o que foi apontado e submeta novamente.</ThemedText>
        </View>
    );
}

function InviteSection({ team, onRegenerated }: { team: TeamDetails; onRegenerated: (token: string) => void }) {
    const toast = useToast();
    const regenerate = useRegenerateInvite();

    const token = team.invite_token ?? null;

    const handleShare = async () => {
        if (!token) return;
        const link = buildInviteLink(token);
        await Share.share({
            message: `Entre no meu time "${team.name}" no Intercurso: ${link}\nCódigo do convite: ${token}`,
        });
    };

    const confirmRegenerate = () =>
        Alert.alert(
            'Gerar novo convite?',
            'O link e o código atuais deixam de funcionar. Quem já entrou no time continua no time.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Gerar novo',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const result = await regenerate.mutateAsync({ teamId: team.team_id });
                            onRegenerated(result.invite_token);
                            toast.success('Novo convite gerado.');
                        } catch (error) {
                            toast.error(friendlyErrorMessage(error, 'Não foi possível gerar um novo convite.'));
                        }
                    },
                },
            ]
        );

    return (
        <Section title="Convite">
            {token ? (
                <>
                    <ThemedText variant="subhead">
                        Compartilhe o link ou o código. Quem receber entra pelo app, e o convite é desativado quando o
                        time é submetido.
                    </ThemedText>
                    <View style={styles.code}>
                        <ThemedText variant="caption">CÓDIGO DO CONVITE</ThemedText>
                        <ThemedText variant="code" selectable>
                            {token}
                        </ThemedText>
                    </View>
                    <Button title="Compartilhar convite" onPress={handleShare} />
                    <Button
                        title="Gerar novo convite"
                        variant="ghost"
                        loading={regenerate.isPending}
                        onPress={confirmRegenerate}
                    />
                </>
            ) : (
                <>
                    <ThemedText variant="subhead">
                        O código deste convite não está disponível neste aparelho. Gere um novo para compartilhar.
                    </ThemedText>
                    <Button
                        title="Gerar novo convite"
                        loading={regenerate.isPending}
                        onPress={confirmRegenerate}
                    />
                </>
            )}
        </Section>
    );
}

function TeamDetailsContent({ teamId }: { teamId: string }) {
    const { user } = useAuth();
    const toast = useToast();
    const details = useTeamDetails(teamId);
    const activeSeason = useActiveSeason();
    const submitTeam = useSubmitTeam();
    const selectCaptain = useSelectCaptain();
    const removeMember = useRemoveTeamMember();
    const leaveTeam = useLeaveTeam();
    const deleteTeam = useDeleteTeam();

    const leaveScreen = useCallback(() => {
        if (router.canGoBack()) router.back();
        else router.replace('/');
    }, []);

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
    const me = user?.user_id;
    const isOwner = !!me && team.owner_id === me;
    const isMember = !!me && team.members.some((member) => member.user_id === me);
    const isDraft = team.status === 'DRAFT';
    const memberCount = team.members.length;
    const registrationOpen =
        activeSeason.data?.status === 'REGISTRATION_OPEN' && activeSeason.data.season_id === team.season_id;

    const min = team.min_members ?? undefined;
    const max = team.max_members ?? undefined;
    const missing = min !== undefined ? Math.max(0, min - memberCount) : 0;
    const quota = getGenderQuota(team, team.members);
    const quotaMessage = quota && !quota.satisfied ? describeMissingQuota(quota) : null;

    const captainName = team.captain_name ?? 'Não definido';
    const membersRange = formatMembersRange(min, max);
    const membersLabel = membersRange ? `${memberCount} (${membersRange})` : String(memberCount);
    const genderRule = team.gender_mode ? formatGenderRule(team) : null;

    let submitBlockedReason: string | null = null;
    if (!registrationOpen) {
        submitBlockedReason = 'Período de inscrições encerrado. Não é mais possível submeter times.';
    } else if (missing > 0) {
        submitBlockedReason = `Faltam ${plural(missing, 'integrante', 'integrantes')} para o mínimo de ${min}.`;
    } else if (quotaMessage) {
        submitBlockedReason = quotaMessage;
    }

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

    const confirmSubmit = () =>
        Alert.alert(
            'Submeter para aprovação?',
            [
                team.name,
                `Modalidade: ${team.modality_name ?? '—'}`,
                `Membros: ${memberCount}`,
                `Capitão: ${captainName}`,
                '',
                '• O time será travado e não aceitará mais membros.',
                '• Ele aguarda a aprovação do monitor.',
                '• A doação de cada integrante será confirmada pela organização.',
            ].join('\n'),
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Submeter',
                    onPress: async () => {
                        await run(
                            () => submitTeam.mutateAsync({ teamId: team.team_id }),
                            'Time submetido para aprovação.',
                            'Não foi possível submeter o time.'
                        );
                    },
                },
            ]
        );

    const confirmCaptain = (member: TeamMember) =>
        Alert.alert('Definir capitão?', `${member.name} passa a ser o capitão do time.`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Definir',
                onPress: () =>
                    run(
                        () => selectCaptain.mutateAsync({ teamId: team.team_id, userId: member.user_id }),
                        `${member.name} é o novo capitão.`,
                        'Não foi possível definir o capitão.'
                    ),
            },
        ]);

    const confirmRemove = (member: TeamMember) =>
        Alert.alert('Remover do time?', `${member.name} será removido(a) do time.`, [
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
        ]);

    const confirmLeave = () =>
        Alert.alert('Sair do time?', 'Você deixa de fazer parte de "' + team.name + '".', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Sair',
                style: 'destructive',
                onPress: async () => {
                    const ok = await run(
                        () => leaveTeam.mutateAsync({ teamId: team.team_id }),
                        'Você saiu do time.',
                        'Não foi possível sair do time.'
                    );
                    if (ok) leaveScreen();
                },
            },
        ]);

    const confirmDelete = () =>
        Alert.alert(
            'Excluir time?',
            `"${team.name}" será excluído. Os integrantes saem do time e o convite deixa de funcionar. Essa ação não pode ser desfeita.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        const ok = await run(
                            () => deleteTeam.mutateAsync({ teamId: team.team_id }),
                            'Time excluído.',
                            'Não foi possível excluir o time.'
                        );
                        if (ok) {
                            leaveScreen();
                        }
                    },
                },
            ]
        );

    return (
        <>
            <Stack.Screen options={{ title: team.name }} />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={details.isRefetching}
                        onRefresh={() => {
                            details.refetch();
                            activeSeason.refetch();
                        }}
                    />
                }
            >
                <View style={styles.hero}>
                    <TeamAvatar name={team.name} photo={team.photo} size={96} />
                    <ThemedText variant="title" selectable>
                        {team.name}
                    </ThemedText>
                    <ThemedText variant="subhead">
                        {team.modality_name ?? 'Modalidade'}
                        {genderRule ? ` · ${genderRule}` : ''}
                    </ThemedText>
                    <TeamStatusBadge status={team.status} />
                    <ThemedText variant="subhead">{STATUS_COPY[team.status]}</ThemedText>
                </View>

                <RejectionNotice team={team} />

                {isOwner && isDraft ? (
                    <InviteSection team={team} onRegenerated={() => details.refetch()} />
                ) : null}

                <Section title="Membros">
                    <InfoRow label="Total" value={membersLabel} />
                    {isDraft && min !== undefined ? (
                        <ThemedText variant="caption">
                            {missing > 0
                                ? `Faltam ${plural(missing, 'integrante', 'integrantes')} para poder submeter.`
                                : 'O time já tem o mínimo de integrantes para submissão.'}
                        </ThemedText>
                    ) : null}
                    {isDraft && quota ? (
                        <ThemedText variant="caption">
                            {quota.satisfied
                                ? `Cota de gênero atendida (${quota.male} homens e ${quota.female} mulheres).`
                                : quotaMessage}
                        </ThemedText>
                    ) : null}
                    {team.members.map((member, index) => {
                        const memberIsOwner = member.user_id === team.owner_id;
                        const memberIsCaptain = member.user_id === team.captain_id || member.role === 'CAPTAIN';
                        const actions: MemberAction[] =
                            isOwner && isDraft
                                ? [
                                      ...(memberIsCaptain
                                          ? []
                                          : [{ label: 'Definir capitão', onPress: () => confirmCaptain(member) }]),
                                      ...(memberIsOwner
                                          ? []
                                          : [
                                                {
                                                    label: 'Remover',
                                                    destructive: true,
                                                    onPress: () => confirmRemove(member),
                                                },
                                            ]),
                                  ]
                                : [];

                        return (
                            <MemberCard
                                key={member.user_id}
                                name={member.name}
                                isOwner={memberIsOwner}
                                isCaptain={memberIsCaptain}
                                donation={isDraft ? undefined : member.donation_status}
                                actions={actions}
                                divider={index > 0}
                            />
                        );
                    })}
                </Section>

                {!isDraft ? (
                    <Section title="Acompanhamento">
                        {team.submmited_at ? (
                            <InfoRow label="Submetido em" value={formatCampusDateTime(team.submmited_at)} />
                        ) : null}
                        <InfoRow
                            label="Doações"
                            value={`${team.donations_confirmed}/${team.donations_total} confirmadas`}
                        />
                        {team.approved_at ? (
                            <InfoRow label="Aprovado em" value={formatCampusDateTime(team.approved_at)} />
                        ) : null}
                    </Section>
                ) : null}

                {isOwner && isDraft ? (
                    <View style={styles.actions}>
                        {submitBlockedReason ? <ThemedText variant="caption">{submitBlockedReason}</ThemedText> : null}
                        <Button
                            title="Submeter para aprovação"
                            disabled={submitBlockedReason !== null}
                            loading={submitTeam.isPending}
                            onPress={confirmSubmit}
                        />
                        <Button
                            title="Excluir time"
                            variant="destructive"
                            loading={deleteTeam.isPending}
                            onPress={confirmDelete}
                        />
                    </View>
                ) : null}

                {isMember && !isOwner && isDraft ? (
                    <Button
                        title="Sair do time"
                        variant="destructive"
                        loading={leaveTeam.isPending}
                        onPress={confirmLeave}
                    />
                ) : null}
            </ScrollView>
        </>
    );
}

export default function TeamDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user, isAuthenticated, isInitializing } = useAuth();

    if (isInitializing) {
        return <LoadingState label="Carregando…" />;
    }

    if (!isAuthenticated || !user) {
        return <LoginPrompt message="Entre com sua conta SUAP para ver o time." />;
    }

    return <TeamDetailsContent teamId={id} />;
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
    notice: {
        gap: spacing.xs,
        padding: spacing.md,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        borderWidth: StyleSheet.hairlineWidth * 4,
        backgroundColor: colors.secondarySystemBackground as string,
    },
    actions: {
        gap: spacing.xs,
    },
    code: {
        gap: 2,
        padding: spacing.md,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.systemBackground as string,
    },
});
