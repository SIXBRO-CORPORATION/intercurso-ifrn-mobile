import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
import type { TeamPhotoFile } from '@/types/team';
import { GenderLabel, type Gender } from '@/types/enums';
import type { ModalitySummaryResponse } from '@/types/modality-list';
import { colors, radius, spacing, useBrandColors } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { formatGenderRule, formatMembers } from '@/utils/modality-gender';

const GENDER_BY_MODE: Record<'MALE' | 'FEMALE', Gender> = { MALE: 'M', FEMALE: 'F' };

const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_MIME_BY_EXTENSION: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
};
const ACCEPTED_PHOTO_MIME = ['image/png', 'image/jpeg', 'image/webp'];

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
    const [photo, setPhoto] = useState<TeamPhotoFile | null>(null);
    const [errors, setErrors] = useState<{ name?: string; modality?: string; photo?: string }>({});
    const [submitError, setSubmitError] = useState<string | null>(null);

    const pickPhoto = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert(
                'Acesso às fotos',
                'Permita o acesso à galeria nas configurações do aparelho para escolher a foto do time.'
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
        return <LoginPrompt message="Entre com sua conta SUAP para criar um time." />;
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
            const created = await createTeam.mutateAsync({
                name: trimmed,
                modality_id: modalityId!,
                photo,
            });
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

            <View style={styles.field}>
                <ThemedText variant="caption">Foto do time (opcional)</ThemedText>
                <View style={styles.photoRow}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={photo ? 'Trocar foto do time' : 'Escolher foto do time'}
                        onPress={pickPhoto}
                        style={({ pressed }) => [styles.photo, { opacity: pressed ? 0.7 : 1 }]}
                    >
                        {photo ? (
                            <Image source={{ uri: photo.uri }} style={styles.photoImage} accessibilityIgnoresInvertColors />
                        ) : (
                            <ThemedText variant="caption">Escolher</ThemedText>
                        )}
                    </Pressable>
                    {photo ? (
                        <View style={styles.photoActions}>
                            <Button title="Trocar foto" variant="secondary" size="sm" onPress={pickPhoto} />
                            <Button title="Remover" variant="ghost" size="sm" onPress={() => setPhoto(null)} />
                        </View>
                    ) : null}
                </View>
                {errors.photo ? (
                    <ThemedText variant="caption" accessibilityRole="alert" style={{ color: brand.primary }}>
                        {errors.photo}
                    </ThemedText>
                ) : (
                    <ThemedText variant="caption">PNG, JPG ou WEBP até 5 MB.</ThemedText>
                )}
            </View>

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
    photoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    photo: {
        width: 96,
        height: 96,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: colors.secondarySystemBackground as string,
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    photoActions: {
        flex: 1,
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
