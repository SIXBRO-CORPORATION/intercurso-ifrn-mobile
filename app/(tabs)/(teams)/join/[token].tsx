import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/button';
import { LoginPrompt } from '@/components/auth/login-prompt';
import { Icon } from '@/components/icon';
import { ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useJoinTeamViaInvite, useTeamInviteInfo } from '@/hooks/useTeams';
import { useToast } from '@/providers/ToastProvider';
import { ApiError } from '@/types/api';
import type { TeamInvitePreview } from '@/types/team';
import { colors, fontFamily, radius, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';

function initialsOf(name: string): string {
    const letters = name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join('');
    return letters || '?';
}

function InviteAvatar({ name, photo }: { name: string; photo?: string | null }) {
    return (
        <View style={styles.avatarRing}>
            {photo ? (
                <Image source={{ uri: photo }} style={styles.avatarPhoto} accessibilityIgnoresInvertColors />
            ) : (
                <ThemedText variant="largeTitle" style={styles.avatarInitials}>
                    {initialsOf(name)}
                </ThemedText>
            )}
        </View>
    );
}

function InfoCard({ team }: { team: TeamInvitePreview }) {
    const max = team.max_members ?? null;
    const membersValue = max != null ? `${team.members_count}/${max}` : String(team.members_count);
    const progress = max ? Math.min(team.members_count / max, 1) : null;

    return (
        <View style={styles.infoCard}>
            <View style={styles.infoRow}>
                <ThemedText variant="body" style={styles.muted}>
                    Dono
                </ThemedText>
                <ThemedText variant="section">{team.owner_name ?? '—'}</ThemedText>
            </View>
            <View style={[styles.infoRow, styles.infoRowDivider]}>
                <ThemedText variant="body" style={styles.muted}>
                    Capitão
                </ThemedText>
                <ThemedText variant="section">{team.captain_name ?? 'Não definido'}</ThemedText>
            </View>
            <View style={[styles.infoRow, styles.infoRowDivider, progress != null && styles.infoRowNoGap]}>
                <ThemedText variant="body" style={styles.muted}>
                    Membros
                </ThemedText>
                <ThemedText variant="section">{membersValue}</ThemedText>
            </View>
            {progress != null ? (
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
            ) : null}
        </View>
    );
}

function DonationBanner() {
    return (
        <View style={styles.donationBanner}>
            <View style={styles.donationIcon}>
                <Icon name="info" size={20} color={colors.surface} />
            </View>
            <View style={styles.donationTexts}>
                <ThemedText variant="section">Doação de alimentos</ThemedText>
                <ThemedText variant="bodySm" style={styles.muted}>
                    Leve sua doação ao monitor para confirmar sua participação.
                </ThemedText>
            </View>
        </View>
    );
}

export default function JoinTeamScreen() {
    const { token } = useLocalSearchParams<{ token: string }>();
    const toast = useToast();
    const { user, isAuthenticated, isInitializing } = useAuth();
    const preview = useTeamInviteInfo(isAuthenticated ? token : '');
    const join = useJoinTeamViaInvite();
    const [joinError, setJoinError] = useState<string | null>(null);

    const handleClose = () => (router.canGoBack() ? router.back() : router.replace('/'));

    if (isInitializing) {
        return <LoadingState label="Carregando…" />;
    }

    if (!isAuthenticated) {
        return <LoginPrompt message="Entre com sua conta SUAP para ver o convite e entrar no time." />;
    }

    if (preview.isPending) {
        return <LoadingState label="Carregando convite…" />;
    }

    if (preview.isError) {
        const clientError = preview.error instanceof ApiError && preview.error.status >= 400 && preview.error.status < 500;
        return (
            <ErrorState
                title="Convite indisponível"
                description={friendlyErrorMessage(preview.error, 'Não foi possível carregar o convite.')}
                onRetry={clientError ? undefined : () => preview.refetch()}
                retrying={preview.isRefetching}
            />
        );
    }

    const team = preview.data;
    const isFull = team.max_members != null && team.members_count >= team.max_members;
    const requiredGender = team.gender_mode === 'MALE' ? 'M' : team.gender_mode === 'FEMALE' ? 'F' : null;
    const genderMismatch = requiredGender !== null && !!user?.gender && user.gender !== requiredGender;
    const joinBlockedReason = isFull
        ? 'Este time já atingiu o limite máximo de membros.'
        : genderMismatch
          ? `Esta modalidade é exclusiva para o gênero ${team.gender_mode === 'MALE' ? 'masculino' : 'feminino'}.`
          : null;

    const handleJoin = async () => {
        if (join.isPending) return;
        setJoinError(null);

        try {
            const result = await join.mutateAsync({ inviteToken: token });
            toast.success(result.message || 'Você entrou no time.');
            router.replace(`/team/${result.team_id}`);
        } catch (error) {
            setJoinError(friendlyErrorMessage(error, 'Não foi possível entrar no time.'));
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.content}>
            <Stack.Screen options={{ headerShown: false }} />
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                onPress={handleClose}
                hitSlop={8}
                style={styles.closeButton}
            >
                <Icon name="close" size={22} color={colors.ink} />
            </Pressable>

            <ThemedText variant="overline" style={styles.inviteLabel}>
                Você foi convidado
            </ThemedText>

            <InviteAvatar name={team.name} photo={team.photo} />

            <ThemedText variant="title" style={styles.centered} selectable>
                {team.name}
            </ThemedText>

            {team.modality_name ? (
                <View style={styles.modalityPill}>
                    <ThemedText variant="caption" style={styles.modalityPillText}>
                        {team.modality_name}
                    </ThemedText>
                </View>
            ) : null}

            <InfoCard team={team} />
            <DonationBanner />

            {joinError ? (
                <ThemedText variant="caption" accessibilityRole="alert" style={styles.errorText}>
                    {joinError}
                </ThemedText>
            ) : null}
            {joinBlockedReason ? (
                <ThemedText variant="caption" accessibilityRole="alert" style={styles.errorText}>
                    {joinBlockedReason}
                </ThemedText>
            ) : null}

            <View style={styles.actions}>
                <Button
                    title="Entrar no time"
                    icon="user_plus"
                    onPress={handleJoin}
                    loading={join.isPending}
                    disabled={joinBlockedReason !== null}
                />
                <Button title="Agora não" variant="neutral" onPress={handleClose} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        flexGrow: 1,
        alignItems: 'center',
        padding: spacing.xl,
        paddingTop: spacing['3xl'],
        gap: spacing.md,
    },
    closeButton: {
        position: 'absolute',
        top: spacing.xl,
        left: spacing.lg,
        padding: spacing.xs,
        zIndex: 1,
    },
    centered: {
        textAlign: 'center',
    },
    muted: {
        color: colors.textSecondary,
    },
    inviteLabel: {
        color: colors.primary,
        textAlign: 'center',
        marginTop: spacing.xl,
    },
    avatarRing: {
        width: 112,
        height: 112,
        borderRadius: radius.pill,
        borderWidth: 3,
        borderColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primarySoft,
        overflow: 'hidden',
        marginTop: spacing.xs,
    },
    avatarPhoto: {
        width: '100%',
        height: '100%',
    },
    avatarInitials: {
        color: colors.primaryDark,
    },
    modalityPill: {
        alignSelf: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        borderCurve: 'continuous',
        backgroundColor: colors.primarySoft,
    },
    modalityPillText: {
        color: colors.primaryDark,
        fontFamily: fontFamily.bold,
    },
    infoCard: {
        width: '100%',
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
    },
    infoRowDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
    },
    infoRowNoGap: {
        paddingBottom: spacing.xs,
    },
    progressTrack: {
        height: 6,
        borderRadius: radius.pill,
        backgroundColor: colors.border,
        marginBottom: spacing.xxs,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: radius.pill,
        backgroundColor: colors.primary,
    },
    donationBanner: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.warningSoft,
    },
    donationIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.warning,
    },
    donationTexts: {
        flex: 1,
        gap: 2,
    },
    errorText: {
        width: '100%',
        color: colors.danger,
    },
    actions: {
        width: '100%',
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
});
