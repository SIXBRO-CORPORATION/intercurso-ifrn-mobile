import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/button';
import { LoginPrompt } from '@/components/auth/login-prompt';
import { InfoRow, Section } from '@/components/management/section';
import { ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useJoinTeamViaInvite, useTeamInviteInfo } from '@/hooks/useTeams';
import { useToast } from '@/providers/ToastProvider';
import { ApiError } from '@/types/api';
import { radius, spacing, useBrandColors } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { formatGenderRule, formatMembersRange } from '@/utils/modality-gender';

export default function JoinTeamScreen() {
    const { token } = useLocalSearchParams<{ token: string }>();
    const brand = useBrandColors();
    const toast = useToast();
    const { user, isAuthenticated, isInitializing } = useAuth();
    const preview = useTeamInviteInfo(isAuthenticated ? token : '');
    const join = useJoinTeamViaInvite();
    const [joinError, setJoinError] = useState<string | null>(null);

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
    const membersRange = formatMembersRange(team.min_members, team.max_members);
    const capacity = membersRange ? `${team.members_count} (${membersRange})` : String(team.members_count);
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
            <View style={styles.hero}>
                {team.photo ? (
                    <Image source={{ uri: team.photo }} style={styles.photo} accessibilityIgnoresInvertColors />
                ) : null}
                <ThemedText variant="title" selectable>
                    {team.name}
                </ThemedText>
                {team.modality_name ? <ThemedText variant="subhead">{team.modality_name}</ThemedText> : null}
            </View>

            <Section title="Sobre o time">
                {team.modality_name ? <InfoRow label="Modalidade" value={team.modality_name} /> : null}
                {team.gender_mode ? <InfoRow label="Regra de gênero" value={formatGenderRule(team)} /> : null}
                <InfoRow label="Membros" value={capacity} />
                <InfoRow label="Dono" value={team.owner_name ?? '—'} />
                <InfoRow label="Capitão" value={team.captain_name ?? 'Não definido'} />
            </Section>

            {joinError ? (
                <ThemedText variant="caption" accessibilityRole="alert" style={{ color: brand.primary }}>
                    {joinError}
                </ThemedText>
            ) : null}

            {joinBlockedReason ? (
                <ThemedText variant="caption" accessibilityRole="alert" style={{ color: brand.primary }}>
                    {joinBlockedReason}
                </ThemedText>
            ) : null}
            <Button
                title="Entrar no time"
                onPress={handleJoin}
                loading={join.isPending}
                disabled={joinBlockedReason !== null}
            />
            <Button title="Cancelar" variant="ghost" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        gap: spacing.md,
    },
    hero: {
        gap: spacing.xs,
        alignItems: 'flex-start',
    },
    photo: {
        width: 72,
        height: 72,
        borderRadius: radius.lg,
    },
});
