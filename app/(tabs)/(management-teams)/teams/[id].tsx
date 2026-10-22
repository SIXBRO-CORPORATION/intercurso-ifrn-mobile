import { useRef, useState, type RefObject } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Button } from '@/components/button';
import { BottomSheet, type BottomSheetHandle } from '@/components/overlays/bottom-sheet';
import { Icon } from '@/components/icon';
import { ManagementGuard } from '@/components/management/management-guard';
import { ErrorState, LoadingState } from '@/components/states/screen-states';
import { MemberAvatar, MemberCard } from '@/components/teams/member-card';
import { TeamStatusBadge } from '@/components/teams/team-status-badge';
import { ThemedText } from '@/components/themed-text';
import { useApproveTeam, useConfirmDonation, useRejectTeam, useTeamDetails } from '@/hooks/useTeams';
import { useToast } from '@/providers/ToastProvider';
import { DonationStatusLabel, type TeamStatus } from '@/types/enums';
import type { TeamMember } from '@/types/team';
import { colors, fontFamily, radius, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { formatCampusDate } from '@/utils/campus-time';
import { formatGenderRule, formatMembersRange } from '@/utils/modality-gender';
import { describeMissingQuota, getGenderQuota } from '@/utils/team-gender-quota';

const REJECTION_REASON_MAX = 500;

const STATUS_COPY: Record<TeamStatus, string> = {
    DRAFT: 'Em rascunho: o dono ainda está montando a equipe. Ainda não há o que aprovar.',
    SUBMITTED: 'Aguardando aprovação. Confirme a doação de cada integrante e depois aprove ou rejeite a equipe.',
    APPROVED: 'Equipe aprovada e liberada para competir.',
    REJECTED: 'Equipe rejeitada.',
};

const REJECTION_PRESETS = [
    { label: 'Poucos integrantes', reason: 'Número mínimo de integrantes não atingido.' },
    { label: 'Doações pendentes', reason: 'Há doações pendentes de confirmação.' },
    { label: 'Dados incorretos', reason: 'Os dados informados estão incorretos.' },
    { label: 'Outro', reason: '' },
];

function plural(count: number, one: string, many: string): string {
    return `${count} ${count === 1 ? one : many}`;
}

function DonationSummaryCard({ confirmed, total }: { confirmed: number; total: number }) {
    const pending = total - confirmed;
    const complete = pending <= 0;
    const percent = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    const tone = complete ? colors.primary : colors.warning;
    const toneText = complete ? colors.primaryDark : colors.warningText;

    return (
        <View style={styles.donationCard}>
            <View style={styles.donationHeader}>
                <ThemedText variant="body" style={styles.donationLabel}>
                    Doações confirmadas
                </ThemedText>
                <ThemedText variant="title">
                    {confirmed}/{total}
                </ThemedText>
            </View>
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: tone }]} />
            </View>
            <ThemedText variant="caption" style={{ color: toneText }}>
                {complete
                    ? `Todas as doações confirmadas · ${percent}% completo`
                    : `Falta ${plural(pending, 'membro', 'membros')} · ${percent}% completo`}
            </ThemedText>
        </View>
    );
}

function MemberDonationRow({
    member,
    canConfirm,
    confirming,
    onConfirm,
}: {
    member: TeamMember;
    canConfirm: boolean;
    confirming: boolean;
    onConfirm: () => void;
}) {
    const confirmed = member.donation_status === 'DONATION_CONFIRMED';

    return (
        <View
            style={styles.memberRow}
            accessible
            accessibilityLabel={`${member.name}, ${DonationStatusLabel[member.donation_status]}`}
        >
            <MemberAvatar name={member.name} />
            <View style={styles.memberTexts}>
                <ThemedText variant="section" numberOfLines={1}>
                    {member.name}
                </ThemedText>
                <ThemedText variant="bodySm" style={{ color: confirmed ? colors.primaryDark : colors.warningText }}>
                    {DonationStatusLabel[member.donation_status]}
                </ThemedText>
            </View>
            {confirmed ? (
                <View style={styles.confirmedDot}>
                    <Icon name="check" size={14} color={colors.surface} />
                </View>
            ) : canConfirm ? (
                <Button title="Confirmar" size="small" onPress={onConfirm} loading={confirming} />
            ) : null}
        </View>
    );
}

function RejectSheet({
    sheetRef,
    loading,
    onConfirm,
}: {
    sheetRef: RefObject<BottomSheetHandle | null>;
    loading: boolean;
    onConfirm: (reason: string) => void;
}) {
    const [reason, setReason] = useState('');
    const [selected, setSelected] = useState<number | null>(null);
    const trimmed = reason.trim();

    const choosePreset = (index: number) => {
        setSelected(index);
        setReason(REJECTION_PRESETS[index].reason);
    };

    const handleChangeText = (value: string) => {
        setSelected(null);
        setReason(value.slice(0, REJECTION_REASON_MAX));
    };

    return (
        <BottomSheet
            ref={sheetRef}
            title="Rejeitar equipe?"
            description="A equipe será notificada sobre a rejeição."
            snapPoints={['70%']}
        >
            <View style={styles.presetGrid}>
                {REJECTION_PRESETS.map((preset, index) => {
                    const isSelected = selected === index;
                    return (
                        <Pressable
                            key={preset.label}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                            onPress={() => choosePreset(index)}
                            style={[styles.presetChip, isSelected && styles.presetChipSelected]}
                        >
                            <ThemedText
                                variant="label"
                                style={isSelected ? styles.presetChipLabelSelected : styles.presetChipLabel}
                            >
                                {preset.label}
                            </ThemedText>
                        </Pressable>
                    );
                })}
            </View>

            <View style={styles.rejectField}>
                <ThemedText variant="caption">Motivo da rejeição</ThemedText>
                <BottomSheetTextInput
                    value={reason}
                    onChangeText={handleChangeText}
                    multiline
                    placeholder="Ex.: doação de um integrante não foi comprovada"
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel="Motivo da rejeição"
                    style={styles.rejectInput}
                />
                <ThemedText variant="caption" style={styles.rejectCounter}>
                    {trimmed.length}/{REJECTION_REASON_MAX}
                </ThemedText>
            </View>

            <Button
                title="Rejeitar equipe"
                variant="danger"
                disabled={!trimmed}
                loading={loading}
                onPress={() => onConfirm(trimmed)}
            />
            <Button title="Cancelar" variant="neutral" onPress={() => sheetRef.current?.dismiss()} />
        </BottomSheet>
    );
}

function TeamManagementContent({ teamId }: { teamId: string }) {
    const toast = useToast();
    const details = useTeamDetails(teamId);
    const confirmDonation = useConfirmDonation();
    const approveTeam = useApproveTeam();
    const rejectTeam = useRejectTeam();
    const [confirmingUserId, setConfirmingUserId] = useState<string | null>(null);
    const rejectSheetRef = useRef<BottomSheetHandle>(null);

    if (details.isPending) {
        return <LoadingState label="Carregando equipe…" />;
    }

    if (details.isError) {
        return (
            <ErrorState
                title="Não foi possível carregar a equipe"
                description={friendlyErrorMessage(details.error, 'Tente de novo.')}
                onRetry={() => details.refetch()}
                retrying={details.isRefetching}
            />
        );
    }

    const team = details.data;
    const pending = team.members.filter((member) => member.donation_status === 'PENDING_DONATION');
    const canConfirmDonations = team.status === 'SUBMITTED' || team.status === 'APPROVED';
    const showDonations = team.status !== 'DRAFT';
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
    const submittedLabel = team.submmited_at ? `enviada em ${formatCampusDate(team.submmited_at)}` : null;

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

    const handleConfirmDonation = (member: TeamMember) =>
        Alert.alert('Confirmar doação?', `Confirmar a doação de ${member.name}? Não é possível desfazer.`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Confirmar',
                onPress: async () => {
                    setConfirmingUserId(member.user_id);
                    await run(
                        () => confirmDonation.mutateAsync({ teamId: team.team_id, userId: member.user_id }),
                        pending.length === 1
                            ? 'Todas as doações confirmadas. A equipe já pode ser aprovada.'
                            : `Doação de ${member.name} confirmada.`,
                        'Não foi possível confirmar a doação.'
                    );
                    setConfirmingUserId(null);
                },
            },
        ]);

    const askApprove = () =>
        Alert.alert('Aprovar equipe?', `"${team.name}" será liberada para competir.`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Aprovar',
                onPress: () =>
                    run(
                        () => approveTeam.mutateAsync({ teamId: team.team_id }),
                        'Equipe aprovada.',
                        'Não foi possível aprovar a equipe.'
                    ),
            },
        ]);

    const handleReject = async (reason: string) => {
        const ok = await run(
            () => rejectTeam.mutateAsync({ teamId: team.team_id, reason }),
            'Equipe rejeitada.',
            'Não foi possível rejeitar a equipe.'
        );
        if (ok) rejectSheetRef.current?.dismiss();
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
                    <ThemedText variant="bodySm" style={styles.heroSubtitle}>
                        {[team.modality_name ?? 'Modalidade', submittedLabel].filter(Boolean).join(' · ')}
                    </ThemedText>
                    {team.status !== 'SUBMITTED' ? <TeamStatusBadge status={team.status} /> : null}
                    <ThemedText variant="bodySm" style={styles.heroCopy}>
                        {STATUS_COPY[team.status]}
                    </ThemedText>
                </View>

                {team.status === 'REJECTED' && team.rejection_reason ? (
                    <View style={styles.rejectionBanner}>
                        <ThemedText variant="section" style={styles.rejectionBannerTitle}>
                            Última rejeição
                        </ThemedText>
                        <ThemedText variant="bodySm">{team.rejection_reason}</ThemedText>
                        {team.rejected_at ? (
                            <ThemedText variant="caption" style={styles.heroSubtitle}>
                                Em {formatCampusDate(team.rejected_at)}
                            </ThemedText>
                        ) : null}
                    </View>
                ) : null}

                {showDonations ? <DonationSummaryCard confirmed={team.donations_confirmed} total={team.donations_total} /> : null}

                <View style={styles.sectionHeader}>
                    <ThemedText variant="heading">{`Integrantes (${team.members.length})`}</ThemedText>
                </View>
                {membersRange ? <ThemedText variant="caption" style={styles.heroSubtitle}>{membersRange}</ThemedText> : null}
                {quota ? (
                    <ThemedText variant="caption" style={styles.heroSubtitle}>
                        {quota.satisfied
                            ? `Cota de gênero atendida (${quota.male} homens e ${quota.female} mulheres).`
                            : quotaMessage}
                    </ThemedText>
                ) : null}

                <View style={styles.membersList}>
                    {team.members.map((member) =>
                        showDonations ? (
                            <MemberDonationRow
                                key={member.user_id}
                                member={member}
                                canConfirm={canConfirmDonations && member.donation_status === 'PENDING_DONATION'}
                                confirming={confirmingUserId === member.user_id && confirmDonation.isPending}
                                onConfirm={() => handleConfirmDonation(member)}
                            />
                        ) : (
                            <MemberCard
                                key={member.user_id}
                                name={member.name}
                                isOwner={member.user_id === team.owner_id}
                                isCaptain={member.user_id === team.captain_id}
                            />
                        )
                    )}
                </View>

                {team.status === 'SUBMITTED' ? (
                    <View style={styles.actions}>
                        {approveHint ? (
                            <View style={styles.approveHint}>
                                <Icon name="lock" size={16} color={colors.textMuted} />
                                <ThemedText variant="bodySm" style={styles.approveHintText}>
                                    {approveHint}
                                </ThemedText>
                            </View>
                        ) : null}
                        <View style={styles.actionsRow}>
                            <Button
                                title="Rejeitar"
                                variant="dangerSoft"
                                style={styles.actionButton}
                                onPress={() => rejectSheetRef.current?.present()}
                            />
                            <Button
                                title="Aprovar equipe"
                                icon="check"
                                disabled={!canApprove}
                                loading={approveTeam.isPending}
                                style={styles.actionButton}
                                onPress={askApprove}
                            />
                        </View>
                    </View>
                ) : null}
            </ScrollView>

            <RejectSheet sheetRef={rejectSheetRef} loading={rejectTeam.isPending} onConfirm={handleReject} />
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
    heroSubtitle: {
        color: colors.textSecondary,
    },
    heroCopy: {
        color: colors.textSecondary,
    },
    rejectionBanner: {
        gap: spacing.xxs,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.dangerSoft,
    },
    rejectionBannerTitle: {
        color: colors.danger,
    },
    donationCard: {
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    donationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    donationLabel: {
        color: colors.textSecondary,
    },
    progressTrack: {
        height: 8,
        borderRadius: radius.pill,
        backgroundColor: colors.border,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: radius.pill,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    membersList: {
        gap: spacing.sm,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        minHeight: 56,
        padding: spacing.sm,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    memberTexts: {
        flex: 1,
        gap: 2,
    },
    confirmedDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
    },
    actions: {
        gap: spacing.sm,
    },
    approveHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    approveHintText: {
        color: colors.textMuted,
        flex: 1,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionButton: {
        flex: 1,
    },
    presetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    presetChip: {
        minHeight: 40,
        paddingHorizontal: spacing.md,
        justifyContent: 'center',
        borderRadius: radius.pill,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    presetChipSelected: {
        backgroundColor: colors.danger,
    },
    presetChipLabel: {
        color: colors.ink,
    },
    presetChipLabelSelected: {
        color: colors.surface,
        fontFamily: fontFamily.bold,
    },
    rejectField: {
        gap: spacing.xs,
    },
    rejectInput: {
        minHeight: 96,
        padding: spacing.sm,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
        color: colors.ink,
        textAlignVertical: 'top',
    },
    rejectCounter: {
        alignSelf: 'flex-end',
        color: colors.textMuted,
    },
});
