import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { LoginPrompt } from '@/components/auth/login-prompt';
import { FormField } from '@/components/form/form-field';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useModalities } from '@/hooks/useModalities';
import { useActiveSeason } from '@/hooks/useSeasons';
import { useCreateTeam } from '@/hooks/useTeams';
import { useToast } from '@/providers/ToastProvider';
import { ApiError } from '@/types/api';
import { GenderLabel, type Gender } from '@/types/enums';
import type { ModalitySummaryResponse } from '@/types/modality-list';
import { colors, radius, spacing, useBrandColors } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { formatGenderRule, formatMembers } from '@/utils/modality-gender';
import { inviteStore } from '@/utils/team-invite';

const GENDER_BY_MODE: Record<'MALE' | 'FEMALE', Gender> = { MALE: 'M', FEMALE: 'F' };

function unavailableReason(modality: ModalitySummaryResponse, gender: Gender | null | undefined): string | null {
    if (modality.gender_mode === 'MIXED') return null;
    if (!gender) return 'Não foi possível confirmar seu gênero no SUAP.';
    if (GENDER_BY_MODE[modality.gender_mode] !== gender) {
        return `Exclusiva para o gênero ${GenderLabel[GENDER_BY_MODE[modality.gender_mode]].toLowerCase()}.`;
    }
    return null;
}

export default function CreateTeamScreen() {
    const brand = useBrandColors();
    const toast = useToast();
    const { user, isAuthenticated, isInitializing } = useAuth();
    const activeSeason = useActiveSeason();
    const season = activeSeason.data;
    const modalities = useModalities(season?.season_id);
    const createTeam = useCreateTeam();

    const [name, setName] = useState('');
    const [modalityId, setModalityId] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ name?: string; modality?: string }>({});
    const [submitError, setSubmitError] = useState<string | null>(null);

    if (isInitializing || activeSeason.isPending) {
        return <LoadingState label="Carregando…" />;
    }

    if (!isAuthenticated || !user) {
        return <LoginPrompt message="Entre com sua conta SUAP para criar um time." />;
    }

    if (activeSeason.isError && !season) {
        const noSeason = activeSeason.error instanceof ApiError && activeSeason.error.status < 500 && activeSeason.error.status > 0;
        if (!noSeason) {
            return (
                <ErrorState
                    title="Não foi possível verificar as inscrições"
                    description={friendlyErrorMessage(activeSeason.error, 'Tente de novo.')}
                    onRetry={() => activeSeason.refetch()}
                    retrying={activeSeason.isRefetching}
                />
            );
        }
    }

    if (!season) {
        return (
            <EmptyState
                title="Inscrições fechadas"
                description="Não há período de inscrições aberto no momento."
                actionLabel="Voltar"
                onAction={() => router.back()}
            />
        );
    }

    if (season.status !== 'REGISTRATION_OPEN') {
        return (
            <EmptyState
                title="Inscrições encerradas"
                description="Período de inscrições encerrado. Aguarde a próxima temporada."
                actionLabel="Voltar"
                onAction={() => router.back()}
            />
        );
    }

    const handleSubmit = async () => {
        if (createTeam.isPending) return;

        const next: typeof errors = {};
        const trimmed = name.trim();
        if (trimmed.length < 3) next.name = 'O nome precisa ter ao menos 3 caracteres.';
        if (!modalityId) next.modality = 'Escolha a modalidade do time.';

        setErrors(next);
        if (Object.keys(next).length > 0) return;

        setSubmitError(null);

        try {
            const created = await createTeam.mutateAsync({ name: trimmed, modality_id: modalityId! });
            if (created.invite_token) {
                await inviteStore.save(created.team_id, created.invite_token);
            }
            toast.success('Time criado. Convide os integrantes pelo link de convite.');
            router.replace(`/team/${created.team_id}`);
        } catch (error) {
            setSubmitError(friendlyErrorMessage(error, 'Não foi possível criar o time.'));
        }
    };

    const renderModalities = () => {
        if (modalities.isPending) {
            return <ThemedText variant="caption">Carregando modalidades…</ThemedText>;
        }

        if (modalities.isError) {
            return (
                <View style={styles.field}>
                    <ThemedText variant="caption" accessibilityRole="alert">
                        Não foi possível carregar as modalidades.
                    </ThemedText>
                    <Button title="Tentar de novo" variant="secondary" size="sm" onPress={() => modalities.refetch()} />
                </View>
            );
        }

        const options = modalities.data ?? [];
        if (options.length === 0) {
            return <ThemedText variant="caption">Nenhuma modalidade disponível nesta temporada.</ThemedText>;
        }

        return (
            <View style={styles.options}>
                {options.map((modality) => {
                    const blocked = unavailableReason(modality, user.gender);
                    const selected = modalityId === modality.modality_id;
                    return (
                        <Pressable
                            key={modality.modality_id}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: selected, disabled: blocked !== null }}
                            accessibilityLabel={`${modality.name}, ${formatGenderRule(modality)}, ${formatMembers(modality)}${blocked ? `. ${blocked}` : ''}`}
                            disabled={blocked !== null}
                            onPress={() => setModalityId(modality.modality_id)}
                        >
                            {({ pressed }) => (
                                <View
                                    style={[
                                        styles.option,
                                        {
                                            borderColor: selected ? brand.primary : 'transparent',
                                            opacity: blocked ? 0.5 : pressed ? 0.7 : 1,
                                        },
                                    ]}
                                >
                                    <ThemedText variant="headline">{modality.name}</ThemedText>
                                    <ThemedText variant="subhead">
                                        {formatGenderRule(modality)} · {formatMembers(modality)}
                                    </ThemedText>
                                    {blocked ? <ThemedText variant="caption">{blocked}</ThemedText> : null}
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        );
    };

    return (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <ThemedText variant="subhead">
                Você será o dono do time e poderá convidar os integrantes por link depois de criá-lo.
            </ThemedText>

            <FormField
                label="Nome do time"
                value={name}
                onChangeText={setName}
                maxLength={255}
                placeholder="Ex.: Informática 2A"
                error={errors.name}
            />

            <View style={styles.field}>
                <ThemedText variant="caption">Modalidade</ThemedText>
                {renderModalities()}
                {errors.modality ? (
                    <ThemedText variant="caption" accessibilityRole="alert" style={{ color: brand.primary }}>
                        {errors.modality}
                    </ThemedText>
                ) : null}
            </View>

            {submitError ? (
                <ThemedText variant="caption" accessibilityRole="alert" style={{ color: brand.primary }}>
                    {submitError}
                </ThemedText>
            ) : null}

            <Button title="Criar time" onPress={handleSubmit} loading={createTeam.isPending} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        gap: spacing.md,
    },
    field: {
        gap: spacing.xs,
    },
    options: {
        gap: spacing.sm,
    },
    option: {
        gap: 2,
        padding: spacing.md,
        borderWidth: 2,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.secondarySystemBackground as string,
    },
});
