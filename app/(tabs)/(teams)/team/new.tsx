import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { Button } from '@/components/button';
import { LoginPrompt } from '@/components/auth/login-prompt';
import { FormField } from '@/components/form/form-field';
import { Icon } from '@/components/icon';
import { QrCode } from '@/components/qr-code';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useModalities } from '@/hooks/useModalities';
import { useActiveSeason } from '@/hooks/useSeasons';
import { useCreateTeam } from '@/hooks/useTeams';
import { ApiError } from '@/types/api';
import type { TeamPhotoFile, TeamRegisterResponse } from '@/types/team';
import { GenderLabel, type Gender } from '@/types/enums';
import type { ModalitySummaryResponse } from '@/types/modality-list';
import { colors, radius, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { formatCampusShortDate, formatCampusTime } from '@/utils/campus-time';
import { formatGenderRule, formatMembers } from '@/utils/modality-gender';
import { buildInviteLink } from '@/utils/team-invite';

const GENDER_BY_MODE: Record<'MALE' | 'FEMALE', Gender> = { MALE: 'M', FEMALE: 'F' };

const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_MIME_BY_EXTENSION: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
};
const ACCEPTED_PHOTO_MIME = ['image/png', 'image/jpeg', 'image/webp'];

type Step = 'modality' | 'details' | 'success';

function extensionOf(value: string): string | null {
    const match = value.toLowerCase().match(/\.([a-z0-9]+)(?:[?#]|$)/);
    return match ? match[1] : null;
}

function toTeamPhoto(asset: ImagePicker.ImagePickerAsset): { photo?: TeamPhotoFile; error?: string } {
    const extension = extensionOf(asset.fileName ?? '') ?? extensionOf(asset.uri);
    const type = asset.mimeType ?? (extension ? PHOTO_MIME_BY_EXTENSION[extension] : undefined);

    if (!type || !ACCEPTED_PHOTO_MIME.includes(type)) {
        return { error: 'Escolha uma foto em PNG, JPG ou WEBP.' };
    }
    if (asset.fileSize != null && asset.fileSize > PHOTO_MAX_BYTES) {
        return { error: 'A foto precisa ter até 5 MB.' };
    }

    const ext = type === 'image/jpeg' ? 'jpg' : type.replace('image/', '');
    return { photo: { uri: asset.uri, name: `team-photo.${ext}`, type } };
}

function unavailableReason(modality: ModalitySummaryResponse, gender: Gender | null | undefined): string | null {
    if (modality.gender_mode === 'MIXED') return null;
    if (!gender) return 'Não foi possível confirmar seu gênero no SUAP.';
    if (GENDER_BY_MODE[modality.gender_mode] !== gender) {
        return `Exclusiva para o gênero ${GenderLabel[GENDER_BY_MODE[modality.gender_mode]].toLowerCase()}.`;
    }
    return null;
}

// Cabeçalho "Passo X de 2" + barra de progresso de 2 segmentos (guia 08/09).
function StepProgress({ step }: { step: 1 | 2; title: string }) {
    return (
        <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
                <View style={[styles.progressSegment, styles.progressSegmentFilled]} />
                <View style={[styles.progressSegment, step === 2 && styles.progressSegmentFilled]} />
            </View>
            <ThemedText variant="caption">Passo {step} de 2</ThemedText>
            <ThemedText variant="title">{step === 1 ? 'Escolha a modalidade' : 'Dados da equipe'}</ThemedText>
        </View>
    );
}

function ModalityOption({
    modality,
    selected,
    blocked,
    onPress,
}: {
    modality: ModalitySummaryResponse;
    selected: boolean;
    blocked: string | null;
    onPress: () => void;
}) {
    return (
        <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled: blocked !== null }}
            accessibilityLabel={`${modality.name}, ${formatGenderRule(modality)}, ${formatMembers(modality)}${blocked ? `. ${blocked}` : ''}`}
            disabled={blocked !== null}
            onPress={onPress}
            style={({ pressed }) => [
                styles.modalityRow,
                selected && styles.modalityRowSelected,
                blocked && styles.modalityRowBlocked,
                { opacity: blocked ? 0.6 : pressed ? 0.8 : 1 },
            ]}
        >
            <View style={styles.modalityIcon}>
                <Icon name={blocked ? 'lock' : 'ball'} size={22} color={blocked ? colors.textMuted : colors.primary} />
            </View>
            <View style={styles.modalityTexts}>
                <ThemedText variant="section">{modality.name}</ThemedText>
                {blocked ? (
                    <ThemedText variant="bodySm" style={styles.modalityBlockedText}>
                        {blocked}
                    </ThemedText>
                ) : (
                    <ThemedText variant="bodySm" style={styles.muted}>
                        {formatGenderRule(modality)} · {formatMembers(modality)}
                    </ThemedText>
                )}
            </View>
            {blocked ? null : selected ? (
                <View style={styles.radioSelected}>
                    <Icon name="check" size={14} color={colors.surface} />
                </View>
            ) : (
                <View style={styles.radio} />
            )}
        </Pressable>
    );
}

// Tela "Equipe criada!" (guia 10) — substitui o header nativo por um topo
// próprio com botão de fechar, já que esta tela não é mais um passo contado.
function SuccessStep({ team }: { team: TeamRegisterResponse }) {
    const inviteLink = team.invite_token ? buildInviteLink(team.invite_token) : null;

    const handleShare = async () => {
        if (!inviteLink || !team.invite_token) return;
        await Share.share({
            message: `Entre na minha equipe "${team.name}" no Intercurso: ${inviteLink}\nCódigo do convite: ${team.invite_token}`,
        });
    };

    return (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.successContent}>
            <Stack.Screen options={{ headerShown: false }} />
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                onPress={() => router.back()}
                hitSlop={8}
                style={styles.closeButton}
            >
                <Icon name="close" size={22} color={colors.ink} />
            </Pressable>

            <View style={styles.successCheck}>
                <Icon name="check" size={32} color={colors.primaryDark} />
            </View>
            <ThemedText variant="title" style={styles.centered}>
                Equipe criada!
            </ThemedText>
            <ThemedText variant="body" style={[styles.centered, styles.muted]}>
                Compartilhe o convite para chamar a galera
            </ThemedText>

            {inviteLink ? (
                <>
                    <View style={styles.inviteLinkBox}>
                        <ThemedText variant="overline" style={styles.muted}>
                            Link de convite
                        </ThemedText>
                        <ThemedText variant="bodyLg" selectable numberOfLines={1}>
                            {inviteLink}
                        </ThemedText>
                    </View>

                    <View style={styles.qrBox}>
                        <QrCode value={inviteLink} size={200} />
                    </View>
                </>
            ) : (
                <ThemedText variant="body" style={[styles.centered, styles.muted]}>
                    O convite desta equipe pode ser gerado a qualquer momento na tela da equipe.
                </ThemedText>
            )}

            <View style={styles.successActions}>
                {inviteLink ? <Button title="Compartilhar convite" icon="share" onPress={handleShare} /> : null}
                <Button
                    title="Ir para minha equipe"
                    variant="neutral"
                    onPress={() => router.replace(`/team/${team.team_id}`)}
                />
            </View>
        </ScrollView>
    );
}

export default function CreateTeamScreen() {
    const { user, isAuthenticated, isInitializing } = useAuth();
    const activeSeason = useActiveSeason();
    const season = activeSeason.data;
    const modalities = useModalities(season?.season_id);
    const createTeam = useCreateTeam();

    const [step, setStep] = useState<Step>('modality');
    const [name, setName] = useState('');
    const [modalityId, setModalityId] = useState<string | null>(null);
    const [photo, setPhoto] = useState<TeamPhotoFile | null>(null);
    const [errors, setErrors] = useState<{ name?: string; photo?: string }>({});
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [createdTeam, setCreatedTeam] = useState<TeamRegisterResponse | null>(null);

    const pickPhoto = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert(
                'Acesso às fotos',
                'Permita o acesso à galeria nas configurações do aparelho para escolher a foto da equipe.'
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (result.canceled || result.assets.length === 0) return;

        const converted = toTeamPhoto(result.assets[0]);
        if (converted.error) {
            setErrors((current) => ({ ...current, photo: converted.error }));
            return;
        }

        setErrors((current) => ({ ...current, photo: undefined }));
        setPhoto(converted.photo!);
    };

    if (isInitializing || activeSeason.isPending) {
        return <LoadingState label="Carregando…" />;
    }

    if (!isAuthenticated || !user) {
        return <LoginPrompt message="Entre com sua conta SUAP para criar uma equipe." />;
    }

    if (activeSeason.isError && !season) {
        const noSeason = activeSeason.error instanceof ApiError && activeSeason.error.status === 404;
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

    if (step === 'success' && createdTeam) {
        return <SuccessStep team={createdTeam} />;
    }

    const options = modalities.data ?? [];
    const selectedModality = options.find((modality) => modality.modality_id === modalityId) ?? null;

    const handleSubmit = async () => {
        if (createTeam.isPending || !modalityId) return;

        const trimmed = name.trim();
        const nextErrors: typeof errors = {};
        if (trimmed.length < 3) nextErrors.name = 'O nome precisa ter ao menos 3 caracteres.';

        setErrors((current) => ({ ...current, ...nextErrors }));
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitError(null);

        try {
            const created = await createTeam.mutateAsync({ name: trimmed, modality_id: modalityId, photo });
            setCreatedTeam(created);
            setStep('success');
        } catch (error) {
            setSubmitError(friendlyErrorMessage(error, 'Não foi possível criar a equipe.'));
        }
    };

    if (step === 'modality') {
        return (
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
                <StepProgress step={1} title="Escolha a modalidade" />
                {season.registration_end_date ? (
                    <ThemedText variant="bodySm" style={styles.muted}>
                        Inscrições abertas até {formatCampusShortDate(season.registration_end_date)} ·{' '}
                        {formatCampusTime(season.registration_end_date)}
                    </ThemedText>
                ) : null}

                {modalities.isPending ? (
                    <ThemedText variant="caption">Carregando modalidades…</ThemedText>
                ) : modalities.isError ? (
                    <View style={styles.field}>
                        <ThemedText variant="caption" accessibilityRole="alert">
                            Não foi possível carregar as modalidades.
                        </ThemedText>
                        <Button title="Tentar de novo" variant="neutral" size="small" onPress={() => modalities.refetch()} />
                    </View>
                ) : options.length === 0 ? (
                    <ThemedText variant="caption">Nenhuma modalidade disponível nesta temporada.</ThemedText>
                ) : (
                    <View style={styles.options}>
                        {options.map((modality) => (
                            <ModalityOption
                                key={modality.modality_id}
                                modality={modality}
                                selected={modalityId === modality.modality_id}
                                blocked={unavailableReason(modality, user.gender)}
                                onPress={() => setModalityId(modality.modality_id)}
                            />
                        ))}
                    </View>
                )}

                <Button title="Continuar" disabled={!modalityId} onPress={() => setStep('details')} />
            </ScrollView>
        );
    }

    return (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <Stack.Screen
                options={{
                    headerLeft: () => (
                        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => setStep('modality')} hitSlop={8}>
                            <Icon name="back" size={24} color={colors.ink} />
                        </Pressable>
                    ),
                }}
            />
            <StepProgress step={2} title="Dados da equipe" />

            <View style={styles.field}>
                <ThemedText variant="caption">Foto da equipe (opcional)</ThemedText>
                <View style={styles.photoRow}>
                    <View style={styles.photoWrap}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={photo ? 'Trocar foto da equipe' : 'Escolher foto da equipe'}
                            onPress={pickPhoto}
                            style={({ pressed }) => [styles.photo, { opacity: pressed ? 0.7 : 1 }]}
                        >
                            {photo ? (
                                <Image source={{ uri: photo.uri }} style={styles.photoImage} accessibilityIgnoresInvertColors />
                            ) : (
                                <Icon name="camera" size={28} color={colors.primary} />
                            )}
                        </Pressable>
                        {!photo ? (
                            <View pointerEvents="none" style={styles.photoAddBadge}>
                                <Icon name="plus" size={14} color={colors.surface} />
                            </View>
                        ) : null}
                    </View>
                    {photo ? (
                        <View style={styles.photoActions}>
                            <Button title="Trocar foto" variant="neutral" size="small" onPress={pickPhoto} />
                            <Button title="Remover" variant="outline" size="small" onPress={() => setPhoto(null)} />
                        </View>
                    ) : (
                        <ThemedText variant="caption" style={styles.muted}>
                            PNG, JPG ou WEBP até 5 MB.
                        </ThemedText>
                    )}
                </View>
                {errors.photo ? (
                    <ThemedText variant="caption" accessibilityRole="alert" style={styles.errorText}>
                        {errors.photo}
                    </ThemedText>
                ) : null}
            </View>

            <FormField
                label="Nome da equipe"
                value={name}
                onChangeText={setName}
                maxLength={255}
                placeholder="Ex.: Falcões"
                hint="Use um nome único para a sua equipe."
                error={errors.name}
            />

            {selectedModality ? (
                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <ThemedText variant="bodySm" style={styles.muted}>
                            Modalidade
                        </ThemedText>
                        <ThemedText variant="body">{selectedModality.name}</ThemedText>
                    </View>
                    <View style={styles.summaryRow}>
                        <ThemedText variant="bodySm" style={styles.muted}>
                            Temporada
                        </ThemedText>
                        <ThemedText variant="body">
                            {season.name} {season.year}
                        </ThemedText>
                    </View>
                    <View style={styles.summaryRow}>
                        <ThemedText variant="bodySm" style={styles.muted}>
                            Membros
                        </ThemedText>
                        <ThemedText variant="body">{formatMembers(selectedModality)}</ThemedText>
                    </View>
                </View>
            ) : null}

            <View style={styles.infoNote}>
                <Icon name="info" size={16} color={colors.primaryDark} />
                <ThemedText variant="bodySm" style={styles.infoNoteText}>
                    Você será o dono da equipe e poderá convidar os integrantes pelo link de convite depois de criá-la.
                </ThemedText>
            </View>

            {submitError ? (
                <ThemedText variant="caption" accessibilityRole="alert" style={styles.errorText}>
                    {submitError}
                </ThemedText>
            ) : null}

            <Button title="Criar equipe" onPress={handleSubmit} loading={createTeam.isPending} />
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
    muted: {
        color: colors.textSecondary,
    },
    errorText: {
        color: colors.danger,
    },

    progressWrap: {
        gap: spacing.xxs,
        marginBottom: spacing.xs,
    },
    progressTrack: {
        flexDirection: 'row',
        gap: spacing.xxs,
        marginBottom: spacing.sm,
    },
    progressSegment: {
        flex: 1,
        height: 4,
        borderRadius: radius.pill,
        backgroundColor: colors.border,
    },
    progressSegmentFilled: {
        backgroundColor: colors.primary,
    },

    options: {
        gap: spacing.sm,
    },
    modalityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        borderWidth: 2,
        borderColor: 'transparent',
        backgroundColor: colors.field,
    },
    modalityRowSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primarySoft,
    },
    modalityRowBlocked: {
        backgroundColor: colors.field,
    },
    modalityIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
    },
    modalityTexts: {
        flex: 1,
        gap: 2,
    },
    modalityBlockedText: {
        color: colors.danger,
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.border,
    },
    radioSelected: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
    },

    photoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    photoWrap: {
        width: 96,
        height: 96,
    },
    photo: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.primaryMuted,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: colors.primarySoft,
    },
    photoAddBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderWidth: 2,
        borderColor: colors.background,
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    photoActions: {
        flex: 1,
        gap: spacing.xs,
    },

    summaryCard: {
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    infoNote: {
        flexDirection: 'row',
        gap: spacing.xs,
        alignItems: 'flex-start',
    },
    infoNoteText: {
        flex: 1,
        color: colors.textSecondary,
    },

    successContent: {
        flexGrow: 1,
        alignItems: 'center',
        padding: spacing.xl,
        paddingTop: spacing['3xl'],
        gap: spacing.md,
    },
    closeButton: {
        position: 'absolute',
        top: spacing.xl,
        right: spacing.lg,
        padding: spacing.xs,
    },
    centered: {
        textAlign: 'center',
    },
    successCheck: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primarySoft,
        marginBottom: spacing.xs,
    },
    inviteLinkBox: {
        width: '100%',
        gap: spacing.xxs,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.primarySoft,
    },
    qrBox: {
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: 'center',
    },
    successActions: {
        width: '100%',
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
});
