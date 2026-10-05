import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/button';
import { LoginPrompt } from '@/components/auth/login-prompt';
import { InfoRow, Section } from '@/components/management/section';
import { ErrorState, LoadingState } from '@/components/states/screen-states';
import { MemberCard, type MemberAction } from '@/components/teams/member-card';
import { TeamStatusBadge } from '@/components/teams/team-status-badge';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useModalities } from '@/hooks/useModalities';
import { useActiveSeason } from '@/hooks/useSeasons';
import {
    useLeaveTeam,
    useRemoveTeamMember,
    useSelectCaptain,
    useSubmitTeam,
    useTeamDetails,
} from '@/hooks/useTeams';
import { useToast } from '@/providers/ToastProvider';
import type { TeamStatus } from '@/types/enums';
import type { TeamDetails, TeamMember } from '@/types/team';
import { colors, radius, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { formatCampusDateTime } from '@/utils/campus-time';
import { formatGenderRule } from '@/utils/modality-gender';
import { buildInviteLink, inviteStore } from '@/utils/team-invite';

const STATUS_COPY: Record<TeamStatus, string> = {
    DRAFT: 'O time está em rascunho. Convide os integrantes e submeta para aprovação quando atingir o mínimo.',
    SUBMITTED: 'Aguardando aprovação do monitor. O time está travado e a organização confirma a doação de cada integrante.',
    APPROVED: 'Time aprovado e liberado para competir.',
    REJECTED: 'O time foi rejeitado pelo monitor. Fale com a organização para saber os próximos passos.',
};

function plural(count: number, one: string, many: string): string {
    return `${count} ${count === 1 ? one : many}`;
}

function InviteSection({ team }: { team: TeamDetails }) {
    const [token, setToken] = useState<string | null | undefined>(undefined);

    useEffect(() => {
        let active = true;
        inviteStore.get(team.team_id).then((value) => {
            if (active) setToken(value);
        });
        return () => {
            active = false;
        };
    }, [team.team_id]);

    if (token === undefined) return null;

    const handleShare = async () => {
        if (!token) return;
        const link = buildInviteLink(token);
        await Share.share({
            message: `Entre no meu time "${team.name}" no Intercurso: ${link}\nCódigo do convite: ${token}`,
        });
    };

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
                </>
            ) : (
                <ThemedText variant="subhead">
                    O link de convite só fica disponível no aparelho em que o time foi criado.
                </ThemedText>
            )}
        </Section>
    );
}

function TeamDetailsContent({ teamId }: { teamId: string }) {
    const { user } = useAuth();
    const toast = useToast();
    const details = useTeamDetails(teamId);
    const activeSeason = useActiveSeason();
    const modalities = useModalities(details.data?.season_id ?? undefined);
    const submitTeam = useSubmitTeam();
    const selectCaptain = useSelectCaptain();
    const removeMember = useRemoveTeamMember();
    const leaveTeam = useLeaveTeam();

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
    const modality = modalities.data?.find((item) => item.modality_id === team.modality_id);
    const memberCount = team.members.length;
    const registrationOpen =
        activeSeason.data?.status === 'REGISTRATION_OPEN' && activeSeason.data.season_id === team.season_id;

    const min = modality?.min_members;
    const max = modality?.max_members;
    const missing = min !== undefined ? Math.max(0, min - memberCount) : 0;

    const captainName = team.captain_name ?? 'Não definido';
    const membersLabel = min !== undefined && max !== undefined ? `${memberCount} (mín. ${min}, máx. ${max})` : String(memberCount);

    let submitBlockedReason: string | null = null;
    if (!registrationOpen) {
        submitBlockedReason = 'Período de inscrições encerrado. Não é mais possível submeter times.';
    } else if (missing > 0) {
        submitBlockedReason = `Faltam ${plural(missing, 'integrante', 'integrantes')} para o mínimo de ${min}.`;
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
                        const ok = await run(
                            () => submitTeam.mutateAsync({ teamId: team.team_id }),
                            'Time submetido para aprovação.',
                            'Não foi possível submeter o time.'
                        );
                        if (ok) inviteStore.remove(team.team_id);
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
                    <ThemedText variant="title" selectable>
                        {team.name}
                    </ThemedText>
                    <ThemedText variant="subhead">
                        {team.modality_name ?? 'Modalidade'}
                        {modality ? ` · ${formatGenderRule(modality)}` : ''}
                    </ThemedText>
                    <TeamStatusBadge status={team.status} />
                    <ThemedText variant="subhead">{STATUS_COPY[team.status]}</ThemedText>
                </View>

                {isOwner && isDraft && team.token_active ? <InviteSection team={team} /> : null}

                <Section title="Membros">
                    <InfoRow label="Total" value={membersLabel} />
                    {isDraft && min !== undefined ? (
                        <ThemedText variant="caption">
                            {missing > 0
                                ? `Faltam ${plural(missing, 'integrante', 'integrantes')} para poder submeter.`
                                : 'O time já tem o mínimo para submissão.'}
                        </ThemedText>
                    ) : null}
                    {isDraft && modality?.gender_mode === 'MIXED' ? (
                        <ThemedText variant="caption">
                            Modalidade mista: a cota de gênero é conferida ao submeter.
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
                        {team.rejected_at ? (
                            <InfoRow label="Rejeitado em" value={formatCampusDateTime(team.rejected_at)} />
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
