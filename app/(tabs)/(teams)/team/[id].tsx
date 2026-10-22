import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/button';
import { LoginPrompt } from '@/components/auth/login-prompt';
import { BottomSheet, type BottomSheetHandle } from '@/components/overlays/bottom-sheet';
import { ConfirmDialog } from '@/components/overlays/confirm-dialog';
import { ErrorState, LoadingState } from '@/components/states/screen-states';
import { Icon, type IconName } from '@/components/icon';
import { MemberAvatar, MemberCard } from '@/components/teams/member-card';
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
import { TeamMemberRoleLabel, type TeamStatus } from '@/types/enums';
import type { TeamDetails, TeamMember } from '@/types/team';
import { colors, radius, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { formatCampusDate, formatCampusDateTime, formatCampusShortDate } from '@/utils/campus-time';
import { formatGenderRule, formatMembersRange } from '@/utils/modality-gender';
import { describeMissingQuota, getGenderQuota } from '@/utils/team-gender-quota';
import { buildInviteLink } from '@/utils/team-invite';

const APPROVED_MEMBERS_PREVIEW_COUNT = 4;

function plural(count: number, one: string, many: string): string {
    return `${count} ${count === 1 ? one : many}`;
}

function InfoBanner({ text }: { text: string }) {
    return (
        <View style={styles.infoBanner}>
            <Icon name="info" size={18} color={colors.primaryDark} />
            <ThemedText variant="bodySm" style={styles.infoBannerText}>
                {text}
            </ThemedText>
        </View>
    );
}

type TimelineState = 'done' | 'active' | 'pending';

const TIMELINE_ICON: Record<TimelineState, IconName> = { done: 'check', active: 'clock', pending: 'minus' };
const TIMELINE_COLOR: Record<TimelineState, string> = {
    done: colors.primary,
    active: colors.warning,
    pending: colors.border,
};

function TimelineStep({
    label,
    trailing,
    state,
    isLast,
}: {
    label: string;
    trailing?: string;
    state: TimelineState;
    isLast: boolean;
}) {
    return (
        <View style={styles.timelineRow}>
            <View style={styles.timelineRail}>
                <View style={[styles.timelineDot, { backgroundColor: TIMELINE_COLOR[state] }]}>
                    <Icon name={TIMELINE_ICON[state]} size={13} color={colors.surface} />
                </View>
                {!isLast ? (
                    <View style={[styles.timelineLine, state === 'done' ? styles.timelineLineDone : null]} />
                ) : null}
            </View>
            <View style={styles.timelineTextRow}>
                <ThemedText variant="body" style={state === 'pending' ? styles.muted : undefined}>
                    {label}
                </ThemedText>
                {trailing ? (
                    <ThemedText variant="section" style={state === 'active' ? styles.warningText : undefined}>
                        {trailing}
                    </ThemedText>
                ) : null}
            </View>
        </View>
    );
}

function SubmittedHero({ team }: { team: TeamDetails }) {
    const donationsDone = team.donations_confirmed >= team.donations_total;

    return (
        <>
            <View style={[styles.banner, styles.bannerWarning]}>
                <View style={[styles.bannerIcon, styles.bannerIconWarning]}>
                    <Icon name="clock" size={22} color={colors.surface} />
                </View>
                <View style={styles.bannerTexts}>
                    <ThemedText variant="section">Aguardando aprovação</ThemedText>
                    {team.submmited_at ? (
                        <ThemedText variant="bodySm" style={styles.warningText}>
                            Enviada em {formatCampusDateTime(team.submmited_at)}
                        </ThemedText>
                    ) : null}
                </View>
            </View>

            <View style={styles.timelineCard}>
                <TimelineStep label="Equipe submetida" state="done" isLast={false} />
                <TimelineStep
                    label="Doações confirmadas"
                    trailing={`${team.donations_confirmed}/${team.donations_total}`}
                    state={donationsDone ? 'done' : 'active'}
                    isLast={false}
                />
                <TimelineStep label="Aprovação do monitor" state="pending" isLast />
            </View>
        </>
    );
}

function NextMatchCard({ team, nextMatch }: { team: TeamDetails; nextMatch: NonNullable<TeamDetails['next_match']> }) {
    const opponent =
        nextMatch.team1?.team_id === team.team_id ? nextMatch.team2 : nextMatch.team1;
    const self = nextMatch.team1?.team_id === team.team_id ? nextMatch.team1 : nextMatch.team2;

    return (
        <View style={styles.nextMatchCard}>
            {nextMatch.group_name ? (
                <ThemedText variant="overline" style={styles.muted}>
                    {nextMatch.group_name}
                </ThemedText>
            ) : null}
            <View style={styles.nextMatchRow}>
                <View style={styles.nextMatchTeam}>
                    <TeamAvatar name={self?.name ?? team.name} photo={self?.photo} size={40} />
                    <ThemedText variant="bodySm" numberOfLines={1} style={styles.nextMatchTeamName}>
                        {self?.name ?? team.name}
                    </ThemedText>
                </View>
                <ThemedText variant="section" style={styles.muted}>
                    vs
                </ThemedText>
                <View style={styles.nextMatchTeam}>
                    <TeamAvatar name={opponent?.name ?? 'A definir'} photo={opponent?.photo} size={40} />
                    <ThemedText variant="bodySm" numberOfLines={1} style={styles.nextMatchTeamName}>
                        {opponent?.name ?? 'A definir'}
                    </ThemedText>
                </View>
            </View>
            {nextMatch.scheduled_date ? (
                <ThemedText variant="bodySm" style={styles.muted}>
                    {formatCampusDateTime(nextMatch.scheduled_date)}
                </ThemedText>
            ) : null}
        </View>
    );
}

function ApprovedHero({ team, seasonYear }: { team: TeamDetails; seasonYear?: number }) {
    return (
        <>
            <View style={[styles.banner, styles.bannerSuccess]}>
                <View style={styles.bannerIconOnTint}>
                    <Icon name="check" size={22} color={colors.surface} />
                </View>
                <View style={styles.bannerTexts}>
                    <ThemedText variant="section" style={styles.onPrimaryText}>
                        Equipe aprovada!
                    </ThemedText>
                    <ThemedText variant="bodySm" style={styles.onPrimaryTextMuted}>
                        {seasonYear
                            ? `Você está dentro do Intercurso ${seasonYear}.`
                            : `"${team.name}" está confirmada para a temporada.`}
                    </ThemedText>
                </View>
            </View>

            {team.next_match ? <NextMatchCard team={team} nextMatch={team.next_match} /> : null}
        </>
    );
}

function RejectedHero({ team }: { team: TeamDetails }) {
    return (
        <>
            <View style={[styles.banner, styles.bannerDanger]}>
                <View style={styles.bannerIconOnTint}>
                    <Icon name="close" size={22} color={colors.surface} />
                </View>
                <View style={styles.bannerTexts}>
                    <ThemedText variant="section" style={styles.onPrimaryText}>
                        Equipe rejeitada
                    </ThemedText>
                    {team.rejected_at ? (
                        <ThemedText variant="bodySm" style={styles.onPrimaryTextMuted}>
                            Revisado pelo monitor em {formatCampusDate(team.rejected_at)}
                        </ThemedText>
                    ) : null}
                </View>
            </View>

            {team.rejection_reason ? (
                <View style={styles.reasonCard} accessibilityRole="alert">
                    <ThemedText variant="overline" style={styles.dangerText}>
                        Motivo
                    </ThemedText>
                    <ThemedText variant="body" style={styles.reasonText}>
                        {team.rejection_reason}
                    </ThemedText>
                </View>
            ) : null}
        </>
    );
}

interface DraftHeroProps {
    team: TeamDetails;
    memberCount: number;
    min?: number;
    max?: number;
    canManageInvite: boolean;
    onCopyInvite: () => void;
    copied: boolean;
    onRegenerateInvite: () => void;
    regenerating: boolean;
}

function DraftHero({
    team,
    memberCount,
    min,
    max,
    canManageInvite,
    onCopyInvite,
    copied,
    onRegenerateInvite,
    regenerating,
}: DraftHeroProps) {
    const progress = max ? Math.min(memberCount / max, 1) : null;
    const hasActiveToken = !!team.invite_token && team.token_active;

    return (
        <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
                <TeamAvatar name={team.name} photo={team.photo} size={64} />
                <View style={styles.heroTexts}>
                    <ThemedText variant="heading" numberOfLines={1}>
                        {team.name}
                    </ThemedText>
                    <ThemedText variant="body" style={styles.muted}>
                        {team.modality_name ?? 'Modalidade'}
                    </ThemedText>
                </View>
                <TeamStatusBadge status="DRAFT" />
            </View>

            <View style={styles.progressBlock}>
                <View style={styles.progressLabelRow}>
                    <ThemedText variant="section">
                        {max !== undefined ? `${memberCount} de ${max} membros` : plural(memberCount, 'membro', 'membros')}
                    </ThemedText>
                    {min !== undefined ? (
                        <ThemedText variant="bodySm" style={styles.muted}>{`mínimo ${min}`}</ThemedText>
                    ) : null}
                </View>
                {max !== undefined ? (
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${(progress ?? 0) * 100}%` }]} />
                    </View>
                ) : null}
            </View>

            {canManageInvite ? (
                hasActiveToken ? (
                    <>
                        <Button
                            title={copied ? 'Link copiado' : 'Copiar link de convite'}
                            variant="soft"
                            icon={copied ? 'check' : 'link'}
                            onPress={onCopyInvite}
                        />
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Gerar novo link de convite"
                            onPress={onRegenerateInvite}
                            disabled={regenerating}
                            hitSlop={8}
                            style={({ pressed }) => [styles.regenerateLink, { opacity: pressed ? 0.6 : 1 }]}
                        >
                            <Icon name="shuffle" size={14} color={colors.textSecondary} />
                            <ThemedText variant="caption" style={styles.muted}>
                                {regenerating ? 'Gerando novo convite…' : 'Gerar novo link de convite'}
                            </ThemedText>
                        </Pressable>
                    </>
                ) : (
                    <Button title="Gerar convite" variant="soft" icon="link" loading={regenerating} onPress={onRegenerateInvite} />
                )
            ) : null}
        </View>
    );
}

function SheetAction({
    icon,
    label,
    tone = 'primary',
    onPress,
}: {
    icon: IconName;
    label: string;
    tone?: 'primary' | 'danger';
    onPress: () => void;
}) {
    const bubble = tone === 'danger' ? colors.dangerSoft : colors.primarySoft;
    const iconColor = tone === 'danger' ? colors.danger : colors.primaryDark;
    const textColor = tone === 'danger' ? colors.danger : colors.ink;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            style={({ pressed }) => [styles.sheetAction, { opacity: pressed ? 0.6 : 1 }]}
        >
            <View style={[styles.sheetActionIcon, { backgroundColor: bubble }]}>
                <Icon name={icon} size={18} color={iconColor} />
            </View>
            <ThemedText variant="body" style={[styles.sheetActionLabel, { color: textColor }]}>
                {label}
            </ThemedText>
            <Icon name="chev_r" size={18} color={colors.textMuted} />
        </Pressable>
    );
}

type ConfirmAction =
    | { type: 'regenerate' }
    | { type: 'captain'; member: TeamMember }
    | { type: 'remove'; member: TeamMember }
    | { type: 'leave' }
    | { type: 'delete' }
    | null;

interface ConfirmDialogContent {
    title: string;
    description?: string;
    confirmLabel: string;
    tone: 'primary' | 'danger';
}

function getConfirmDialogContent(action: ConfirmAction, team: TeamDetails | undefined): ConfirmDialogContent | null {
    if (!action) return null;
    switch (action.type) {
        case 'regenerate':
            return {
                title: 'Gerar novo convite?',
                description: 'O link e o código atuais deixam de funcionar. Quem já entrou no time continua no time.',
                confirmLabel: 'Gerar novo',
                tone: 'danger',
            };
        case 'captain':
            return {
                title: 'Definir capitão?',
                description: `${action.member.name} passa a ser o capitão do time.`,
                confirmLabel: 'Definir',
                tone: 'primary',
            };
        case 'remove':
            return {
                title: 'Remover do time?',
                description: `${action.member.name} será removido(a) do time.`,
                confirmLabel: 'Remover',
                tone: 'danger',
            };
        case 'leave':
            return {
                title: 'Sair do time?',
                description: team ? `Você deixa de fazer parte de "${team.name}".` : undefined,
                confirmLabel: 'Sair',
                tone: 'danger',
            };
        case 'delete':
            return {
                title: 'Excluir time?',
                description: team
                    ? `"${team.name}" será excluído. Os integrantes saem do time e o convite deixa de funcionar. Essa ação não pode ser desfeita.`
                    : undefined,
                confirmLabel: 'Excluir',
                tone: 'danger',
            };
        default:
            return null;
    }
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
    const regenerateInvite = useRegenerateInvite();

    const [activeMember, setActiveMember] = useState<TeamMember | null>(null);
    const [showAllMembers, setShowAllMembers] = useState(false);
    const [rejectionAcknowledged, setRejectionAcknowledged] = useState(false);
    const [inviteCopied, setInviteCopied] = useState(false);
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
    const [confirming, setConfirming] = useState(false);
    const memberSheetRef = useRef<BottomSheetHandle>(null);
    const submitSheetRef = useRef<BottomSheetHandle>(null);
    const actionsSheetRef = useRef<BottomSheetHandle>(null);

    const team = details.data;

    const leaveScreen = useCallback(() => {
        if (router.canGoBack()) router.back();
        else router.replace('/');
    }, []);

    const run = useCallback(async (action: () => Promise<unknown>, success: string, fallback: string) => {
        try {
            await action();
            toast.success(success);
            return true;
        } catch (error) {
            toast.error(friendlyErrorMessage(error, fallback));
            return false;
        }
    }, [toast]);

    const handleShare = useCallback(async () => {
        if (!team?.invite_token) return;
        const link = buildInviteLink(team.invite_token);
        await Share.share({
            message: `Entre no meu time "${team.name}" no Intercurso: ${link}\nCódigo do convite: ${team.invite_token}`,
        });
    }, [team?.invite_token, team?.name]);

    const handleCopyInvite = useCallback(async () => {
        if (!team?.invite_token) return;
        const link = buildInviteLink(team.invite_token);
        await Clipboard.setStringAsync(link);
        setInviteCopied(true);
        setTimeout(() => setInviteCopied(false), 2000);
    }, [team?.invite_token]);

    const openMemberSheet = useCallback((member: TeamMember) => {
        setActiveMember(member);
        memberSheetRef.current?.present();
    }, []);

    const closeMemberSheet = useCallback(() => {
        memberSheetRef.current?.dismiss();
    }, []);

    const closeActionsSheet = useCallback(() => {
        actionsSheetRef.current?.dismiss();
    }, []);

    const handleRegenerateInvite = useCallback(() => {
        setConfirmAction({ type: 'regenerate' });
    }, []);

    const confirmCaptain = useCallback(
        (member: TeamMember) => {
            closeMemberSheet();
            setConfirmAction({ type: 'captain', member });
        },
        [closeMemberSheet]
    );

    const confirmRemove = useCallback(
        (member: TeamMember) => {
            closeMemberSheet();
            setConfirmAction({ type: 'remove', member });
        },
        [closeMemberSheet]
    );

    const confirmLeave = useCallback(() => {
        closeActionsSheet();
        setConfirmAction({ type: 'leave' });
    }, [closeActionsSheet]);

    const confirmDelete = useCallback(() => {
        closeActionsSheet();
        setConfirmAction({ type: 'delete' });
    }, [closeActionsSheet]);

    const cancelConfirmAction = useCallback(() => {
        if (confirming) return;
        setConfirmAction(null);
    }, [confirming]);

    const handleConfirmAction = useCallback(async () => {
        if (!confirmAction || !team) return;
        setConfirming(true);
        try {
            switch (confirmAction.type) {
                case 'regenerate':
                    await run(
                        () => regenerateInvite.mutateAsync({ teamId: team.team_id }),
                        'Novo convite gerado.',
                        'Não foi possível gerar um novo convite.'
                    );
                    break;
                case 'captain':
                    await run(
                        () => selectCaptain.mutateAsync({ teamId: team.team_id, userId: confirmAction.member.user_id }),
                        `${confirmAction.member.name} é o novo capitão.`,
                        'Não foi possível definir o capitão.'
                    );
                    break;
                case 'remove':
                    await run(
                        () => removeMember.mutateAsync({ teamId: team.team_id, userId: confirmAction.member.user_id }),
                        `${confirmAction.member.name} foi removido(a).`,
                        'Não foi possível remover o integrante.'
                    );
                    break;
                case 'leave': {
                    const ok = await run(
                        () => leaveTeam.mutateAsync({ teamId: team.team_id }),
                        'Você saiu do time.',
                        'Não foi possível sair do time.'
                    );
                    if (ok) leaveScreen();
                    break;
                }
                case 'delete': {
                    const ok = await run(
                        () => deleteTeam.mutateAsync({ teamId: team.team_id }),
                        'Time excluído.',
                        'Não foi possível excluir o time.'
                    );
                    if (ok) leaveScreen();
                    break;
                }
            }
        } finally {
            setConfirming(false);
            setConfirmAction(null);
        }
    }, [confirmAction, deleteTeam, leaveScreen, leaveTeam, regenerateInvite, removeMember, run, selectCaptain, team]);

    const handleConfirmSubmit = useCallback(async () => {
        if (!team) return;
        const ok = await run(
            () => submitTeam.mutateAsync({ teamId: team.team_id }),
            'Time submetido para aprovação.',
            'Não foi possível submeter o time.'
        );
        if (ok) {
            submitSheetRef.current?.dismiss();
        }
    }, [run, submitTeam, team]);

    const handleContactMonitor = useCallback(() => {
        toast.info('Em breve você vai poder falar com o monitor por aqui.');
    }, [toast]);

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

    if (!team) {
        return null;
    }

    const me = user?.user_id;
    const isOwner = !!me && team.owner_id === me;
    const isMember = !!me && team.members.some((member) => member.user_id === me);
    const isRejectedView = team.status === 'DRAFT' && !!team.rejection_reason && !rejectionAcknowledged;
    const isDraft = team.status === 'DRAFT' && !isRejectedView;
    const memberCount = team.members.length;
    const seasonYear = activeSeason.data?.season_id === team.season_id ? activeSeason.data?.year : undefined;
    const donationsPercent =
        team.donations_total > 0 ? Math.round((team.donations_confirmed / team.donations_total) * 100) : null;

    const min = team.min_members ?? undefined;
    const max = team.max_members ?? undefined;
    const missing = min !== undefined ? Math.max(0, min - memberCount) : 0;
    const quota = getGenderQuota(team, team.members);
    const quotaMessage = quota && !quota.satisfied ? describeMissingQuota(quota) : null;

    const captainName = team.captain_name ?? 'Não definido';
    const membersRange = formatMembersRange(min, max);
    const membersLabel = membersRange ? `${memberCount} (${membersRange})` : String(memberCount);
    const genderRule = team.gender_mode ? formatGenderRule(team) : null;

    const submitBlockedReason = !team.can_submit ? team.submit_blocked_reason ?? null : null;

    const canShareInvite = isOwner && isDraft && !!team.invite_token && team.token_active;
    const canManageActions = isDraft && (isOwner || isMember);
    const confirmDialogContent = getConfirmDialogContent(confirmAction, team);

    return (
        <>
            <Stack.Screen
                options={{
                    title: team.name,
                    headerRight: canManageActions
                        ? () => (
                              <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel="Ações da equipe"
                                  onPress={() => actionsSheetRef.current?.present()}
                                  hitSlop={8}
                                  style={styles.headerAction}
                              >
                                  <Icon name="more" size={20} color={colors.ink} />
                              </Pressable>
                          )
                        : undefined,
                }}
            />
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
                {isRejectedView ? (
                    <RejectedHero team={team} />
                ) : isDraft ? (
                    <DraftHero
                        team={team}
                        memberCount={memberCount}
                        min={min}
                        max={max}
                        canManageInvite={isOwner}
                        onCopyInvite={handleCopyInvite}
                        copied={inviteCopied}
                        onRegenerateInvite={handleRegenerateInvite}
                        regenerating={regenerateInvite.isPending}
                    />
                ) : team.status === 'SUBMITTED' ? (
                    <SubmittedHero team={team} />
                ) : (
                    <ApprovedHero team={team} seasonYear={seasonYear} />
                )}

                {genderRule ? (
                    <ThemedText variant="bodySm" style={styles.muted}>
                        {genderRule}
                    </ThemedText>
                ) : null}

                <View style={styles.sectionHeader}>
                    <ThemedText variant="heading">{`Integrantes (${memberCount})`}</ThemedText>
                    {isOwner && isDraft && canShareInvite ? (
                        <Pressable accessibilityRole="button" accessibilityLabel="Convidar" onPress={handleShare} hitSlop={8}>
                            <ThemedText variant="section" style={styles.link}>
                                Convidar
                            </ThemedText>
                        </Pressable>
                    ) : team.status === 'APPROVED' ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Ver chaves"
                            onPress={() => router.push('/(brackets)')}
                            hitSlop={8}
                        >
                            <ThemedText variant="section" style={styles.link}>
                                Ver chaves
                            </ThemedText>
                        </Pressable>
                    ) : team.status === 'SUBMITTED' && donationsPercent !== null ? (
                        <View style={styles.donationBadge}>
                            <ThemedText variant="caption" style={styles.warningText}>
                                {`${donationsPercent}% das doações`}
                            </ThemedText>
                        </View>
                    ) : null}
                </View>

                <ThemedText variant="label" style={styles.muted}>
                    {membersLabel} integrantes
                </ThemedText>

                {isDraft && min !== undefined ? (
                    <ThemedText variant="caption" style={styles.muted}>
                        {missing > 0
                            ? `Faltam ${plural(missing, 'integrante', 'integrantes')} para poder submeter.`
                            : 'O time já tem o mínimo de integrantes para submissão.'}
                    </ThemedText>
                ) : null}
                {isDraft && quota ? (
                    <ThemedText variant="caption" style={styles.muted}>
                        {quota.satisfied
                            ? `Cota de gênero atendida (${quota.male} homens e ${quota.female} mulheres).`
                            : quotaMessage}
                    </ThemedText>
                ) : null}

                <View style={styles.membersList}>
                    {(team.status === 'APPROVED' && !showAllMembers
                        ? team.members.slice(0, APPROVED_MEMBERS_PREVIEW_COUNT)
                        : team.members
                    ).map((member) => (
                        <MemberCard
                            key={member.user_id}
                            name={member.name}
                            isOwner={member.user_id === team.owner_id}
                            isCaptain={member.user_id === team.captain_id}
                            donation={isDraft ? undefined : member.donation_status}
                            onPress={isOwner && isDraft ? () => openMemberSheet(member) : undefined}
                        />
                    ))}
                    {team.status === 'APPROVED' && !showAllMembers && memberCount > APPROVED_MEMBERS_PREVIEW_COUNT ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Ver mais ${memberCount - APPROVED_MEMBERS_PREVIEW_COUNT} integrantes`}
                            onPress={() => setShowAllMembers(true)}
                            hitSlop={8}
                        >
                            <ThemedText variant="section" style={styles.link}>
                                {`+ ${memberCount - APPROVED_MEMBERS_PREVIEW_COUNT} integrantes`}
                            </ThemedText>
                        </Pressable>
                    ) : null}
                </View>

                {team.status === 'SUBMITTED' ? (
                    <InfoBanner text="Leve sua doação de alimentos ao monitor para confirmar sua participação." />
                ) : null}

                {isOwner && isDraft ? (
                    <View style={styles.actions}>
                        {submitBlockedReason ? (
                            <ThemedText variant="caption" style={styles.muted}>
                                {submitBlockedReason}
                            </ThemedText>
                        ) : null}
                        <Button
                            title="Submeter para aprovação"
                            icon="check"
                            disabled={submitBlockedReason !== null}
                            onPress={() => submitSheetRef.current?.present()}
                        />
                    </View>
                ) : null}

                {isOwner && isRejectedView ? (
                    <View style={styles.actions}>
                        <Button title="Voltar para rascunho" icon="edit" onPress={() => setRejectionAcknowledged(true)} />
                        <Button title="Falar com o monitor" variant="neutral" onPress={handleContactMonitor} />
                    </View>
                ) : null}
            </ScrollView>

            <BottomSheet ref={memberSheetRef} onDismiss={() => setActiveMember(null)} snapPoints={['40%']}>
                {activeMember ? (
                    <View style={styles.memberSheet}>
                        <View style={styles.memberSheetHeader}>
                            <MemberAvatar name={activeMember.name} size={48} />
                            <View style={styles.memberSheetTexts}>
                                <ThemedText variant="heading" numberOfLines={1}>
                                    {activeMember.name}
                                </ThemedText>
                                <ThemedText variant="body" style={styles.muted}>
                                    {activeMember.joined_at
                                        ? `${TeamMemberRoleLabel[activeMember.role]} · entrou em ${formatCampusShortDate(activeMember.joined_at)}`
                                        : TeamMemberRoleLabel[activeMember.role]}
                                </ThemedText>
                            </View>
                        </View>

                        {activeMember.user_id !== team.captain_id ? (
                            <SheetAction icon="star" label="Tornar capitão" onPress={() => confirmCaptain(activeMember)} />
                        ) : null}
                        {activeMember.user_id !== team.owner_id ? (
                            <SheetAction
                                icon="trash"
                                label="Remover da equipe"
                                tone="danger"
                                onPress={() => confirmRemove(activeMember)}
                            />
                        ) : null}

                        <Button title="Cancelar" variant="neutral" onPress={closeMemberSheet} />
                    </View>
                ) : null}
            </BottomSheet>

            <BottomSheet
                ref={submitSheetRef}
                title="Submeter para aprovação?"
                description="Depois de submetida, a equipe não aceita mais novos membros e aguarda a confirmação das doações pelo monitor."
                snapPoints={['55%']}
            >
                <View style={styles.submitSummaryCard}>
                    <View style={styles.avatarStack}>
                        {team.members.slice(0, 5).map((member, index) => (
                            <View
                                key={member.user_id}
                                style={[styles.avatarStackItem, { marginLeft: index === 0 ? 0 : -10, zIndex: 5 - index }]}
                            >
                                <MemberAvatar name={member.name} size={32} />
                            </View>
                        ))}
                        {memberCount > 5 ? (
                            <ThemedText variant="bodySm" style={styles.avatarStackMore}>{`+${memberCount - 5}`}</ThemedText>
                        ) : null}
                    </View>
                    <ThemedText variant="section">{`${plural(memberCount, 'membro', 'membros')} · Capitão: ${captainName}`}</ThemedText>
                    {missing === 0 && min !== undefined ? (
                        <View style={styles.checkRow}>
                            <Icon name="check" size={16} color={colors.primary} />
                            <ThemedText variant="bodySm" style={styles.primaryDarkText}>
                                {`Mínimo de ${min} membros atingido`}
                            </ThemedText>
                        </View>
                    ) : null}
                </View>

                <View style={styles.infoList}>
                    <View style={styles.infoListRow}>
                        <Icon name="info" size={16} color={colors.textMuted} />
                        <ThemedText variant="bodySm" style={styles.muted}>
                            Link de convite será desativado
                        </ThemedText>
                    </View>
                    <View style={styles.infoListRow}>
                        <Icon name="info" size={16} color={colors.textMuted} />
                        <ThemedText variant="bodySm" style={styles.muted}>
                            Doações pendentes até a confirmação
                        </ThemedText>
                    </View>
                </View>

                <Button title="Confirmar submissão" loading={submitTeam.isPending} onPress={handleConfirmSubmit} />
                <Button
                    title="Cancelar"
                    variant="neutral"
                    disabled={submitTeam.isPending}
                    onPress={() => submitSheetRef.current?.dismiss()}
                />
            </BottomSheet>

            <BottomSheet ref={actionsSheetRef} title="Ações da equipe" snapPoints={['35%']}>
                <View style={styles.memberSheet}>
                    {isOwner ? (
                        <>
                            {canShareInvite ? (
                                <SheetAction
                                    icon="share"
                                    label="Compartilhar convite"
                                    onPress={() => {
                                        closeActionsSheet();
                                        handleShare();
                                    }}
                                />
                            ) : null}
                            <SheetAction icon="trash" label="Excluir equipe" tone="danger" onPress={confirmDelete} />
                        </>
                    ) : (
                        <SheetAction icon="logout" label="Sair do time" tone="danger" onPress={confirmLeave} />
                    )}
                    <Button title="Cancelar" variant="neutral" onPress={closeActionsSheet} />
                </View>
            </BottomSheet>

            <ConfirmDialog
                visible={confirmAction !== null}
                title={confirmDialogContent?.title ?? ''}
                description={confirmDialogContent?.description}
                confirmLabel={confirmDialogContent?.confirmLabel}
                tone={confirmDialogContent?.tone}
                confirming={confirming}
                onConfirm={handleConfirmAction}
                onCancel={cancelConfirmAction}
            />
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
    muted: {
        color: colors.textSecondary,
    },
    link: {
        color: colors.primary,
    },
    headerAction: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.field,
    },

    heroCard: {
        gap: spacing.sm,
        padding: spacing.lg,
        borderRadius: radius.xl,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    heroTexts: {
        flex: 1,
        gap: 2,
    },
    progressBlock: {
        gap: spacing.xs,
    },
    progressLabelRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
    },
    progressTrack: {
        height: 8,
        borderRadius: radius.pill,
        backgroundColor: colors.field,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: radius.pill,
        backgroundColor: colors.primary,
    },
    regenerateLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xxs,
        paddingVertical: spacing.xxs,
    },

    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.xl,
        borderCurve: 'continuous',
    },
    bannerWarning: {
        backgroundColor: colors.warningSoft,
    },
    bannerSuccess: {
        backgroundColor: colors.primary,
    },
    bannerDanger: {
        backgroundColor: colors.danger,
    },
    bannerIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerIconWarning: {
        backgroundColor: colors.warning,
    },
    bannerIconOnTint: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    bannerTexts: {
        flex: 1,
        gap: 2,
    },
    onPrimaryText: {
        color: colors.surface,
    },
    onPrimaryTextMuted: {
        color: 'rgba(255, 255, 255, 0.85)',
    },
    warningText: {
        color: colors.warningText,
    },
    dangerText: {
        color: colors.danger,
    },
    primaryDarkText: {
        color: colors.primaryDark,
    },
    reasonCard: {
        gap: spacing.xxs,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.dangerSoft,
    },
    reasonText: {
        color: colors.ink,
    },
    donationBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        borderCurve: 'continuous',
        backgroundColor: colors.warningSoft,
    },

    timelineCard: {
        padding: spacing.md,
        borderRadius: radius.xl,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    timelineRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    timelineRail: {
        alignItems: 'center',
    },
    timelineDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timelineLine: {
        width: 2,
        flex: 1,
        minHeight: spacing.lg,
        backgroundColor: colors.border,
    },
    timelineLineDone: {
        backgroundColor: colors.primary,
    },
    timelineTextRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: spacing.md,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    membersList: {
        gap: spacing.sm,
    },

    nextMatchCard: {
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.xl,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    nextMatchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    nextMatchTeam: {
        flex: 1,
        alignItems: 'center',
        gap: spacing.xxs,
    },
    nextMatchTeamName: {
        textAlign: 'center',
    },

    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.primarySoft,
    },
    infoBannerText: {
        flex: 1,
        color: colors.primaryDark,
    },

    actions: {
        gap: spacing.xs,
    },

    memberSheet: {
        gap: spacing.xs,
    },
    memberSheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingBottom: spacing.sm,
    },
    memberSheetTexts: {
        flex: 1,
        gap: 2,
    },
    sheetAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 56,
    },
    sheetActionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sheetActionLabel: {
        flex: 1,
    },

    submitSummaryCard: {
        gap: spacing.xs,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    avatarStack: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarStackItem: {
        borderWidth: 2,
        borderColor: colors.field,
        borderRadius: 999,
    },
    avatarStackMore: {
        marginLeft: spacing.xs,
        color: colors.textSecondary,
    },
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
    },
    infoList: {
        gap: spacing.xs,
    },
    infoListRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
});
