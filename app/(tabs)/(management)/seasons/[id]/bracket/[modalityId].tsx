import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/button';
import { Icon, type IconName } from '@/components/icon';
import { ManagementGuard } from '@/components/management/management-guard';
import { InfoRow, Section } from '@/components/management/section';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import {
    useBracketDetails,
    useBracketPreview,
    useBracketsBySeason,
    useCreateBracket,
    useResortBracket,
} from '@/hooks/useBrackets';
import { useAllModalities } from '@/hooks/useModalities';
import { useSeasonDetails } from '@/hooks/useSeasons';
import { useToast } from '@/providers/ToastProvider';
import type { BracketMatchResponse } from '@/types/bracket';
import { BracketStatusLabel, ModalityFormatLabel, type MatchStatus, type ModalityFormat, type SeasonStatus } from '@/types/enums';
import { colors, radius, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { formatCampusDateTime } from '@/utils/campus-time';

const FORMATS: ModalityFormat[] = ['KNOCKOUT', 'GROUP_STAGE_KNOCKOUT', 'ROUND_ROBIN', 'TRIANGULAR'];

const CREATABLE_SEASON_STATUSES: SeasonStatus[] = ['REGISTRATION_CLOSED', 'IN_PROGRESS'];

const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
    SCHEDULED: 'Agendada',
    IN_PROGRESS: 'Em andamento',
    FINISHED: 'Finalizada',
};

const FORMAT_META: Record<ModalityFormat, { description: string; icon: IconName }> = {
    KNOCKOUT: { description: 'Eliminação direta', icon: 'bracket' },
    GROUP_STAGE_KNOCKOUT: { description: 'Fase de grupos e eliminatórias', icon: 'grid' },
    ROUND_ROBIN: { description: 'Pontos corridos', icon: 'users' },
    TRIANGULAR: { description: '3 times jogam entre si', icon: 'chart' },
};

function matchTitle(match: BracketMatchResponse): string {
    const home = match.team1_name ?? 'A definir';
    const away = match.team2_name ?? 'A definir';
    return `${home} x ${away}`;
}

function StepProgress({ step }: { step: 1 | 2 }) {
    return (
        <View style={styles.stepWrapper}>
            <View style={styles.stepBars}>
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={[styles.stepBar, step === 2 ? styles.stepBarActive : styles.stepBarInactive]} />
            </View>
            <ThemedText variant="caption">{`Passo ${step} de 2`}</ThemedText>
        </View>
    );
}

function FormatCard({ format, selected, onSelect }: { format: ModalityFormat; selected: boolean; onSelect: () => void }) {
    const meta = FORMAT_META[format];
    return (
        <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${ModalityFormatLabel[format]}, ${meta.description}`}
            onPress={onSelect}
            style={({ pressed }) => [
                styles.formatCard,
                selected && styles.formatCardSelected,
                { opacity: pressed ? 0.85 : 1 },
            ]}
        >
            <View style={[styles.formatIcon, selected && styles.formatIconSelected]}>
                <Icon name={meta.icon} size={22} color={selected ? colors.surface : colors.ink} />
            </View>
            <View style={styles.formatTexts}>
                <ThemedText variant="section">{ModalityFormatLabel[format]}</ThemedText>
                <ThemedText variant="caption">{meta.description}</ThemedText>
            </View>
            {selected ? (
                <View style={styles.formatCheck}>
                    <Icon name="check" size={14} color={colors.surface} />
                </View>
            ) : (
                <View style={styles.formatRadio} />
            )}
        </Pressable>
    );
}

function ChooseFormatStep({
    modalityName,
    format,
    onChangeFormat,
    teamCount,
    previewPending,
    previewError,
    canContinue,
    onContinue,
}: {
    modalityName: string;
    format: ModalityFormat;
    onChangeFormat: (format: ModalityFormat) => void;
    teamCount: number | null;
    previewPending: boolean;
    previewError: unknown;
    canContinue: boolean;
    onContinue: () => void;
}) {
    return (
        <>
            <View style={styles.field}>
                <ThemedText variant="label">Modalidade</ThemedText>
                <View style={styles.fieldBox}>
                    <ThemedText variant="bodyLg">{modalityName}</ThemedText>
                    <Icon name="chev_d" size={18} color={colors.textMuted} />
                </View>
                {teamCount !== null ? (
                    <ThemedText variant="caption">
                        {teamCount} {teamCount === 1 ? 'time aprovado' : 'times aprovados'}
                    </ThemedText>
                ) : null}
            </View>

            <View style={styles.field}>
                <ThemedText variant="label">Formato da competição</ThemedText>
                <View style={styles.formatList}>
                    {FORMATS.map((item) => (
                        <FormatCard key={item} format={item} selected={format === item} onSelect={() => onChangeFormat(item)} />
                    ))}
                </View>
            </View>

            {previewError ? (
                <ThemedText variant="bodySm" accessibilityRole="alert" style={styles.previewError}>
                    {friendlyErrorMessage(previewError, 'Não foi possível calcular a prévia.')}
                </ThemedText>
            ) : null}

            <Button title="Continuar" disabled={!canContinue} loading={previewPending} onPress={onContinue} />
        </>
    );
}

function ReviewAndDrawStep({
    modalityName,
    format,
    teamCount,
    byesEstimated,
    creating,
    onConfirm,
    onBack,
}: {
    modalityName: string;
    format: ModalityFormat;
    teamCount: number;
    byesEstimated: number;
    creating: boolean;
    onConfirm: () => void;
    onBack: () => void;
}) {
    return (
        <>
            <ThemedText variant="title">Revise e sorteie</ThemedText>

            <Section title="Resumo">
                <InfoRow label="Modalidade" value={modalityName} />
                <InfoRow label="Formato" value={ModalityFormatLabel[format]} />
                <InfoRow label="Times aprovados" value={String(teamCount)} />
                <InfoRow label="Byes estimados" value={String(byesEstimated)} />
            </Section>

            <View style={styles.banner}>
                <Icon name="info" size={18} color={colors.warningText} />
                <ThemedText variant="bodySm" style={styles.bannerWarningText}>
                    Se o número de times for ímpar, o sistema cria um bye e a partida é vencida por W.O.
                </ThemedText>
            </View>

            <View style={[styles.banner, styles.bannerSoft]}>
                <Icon name="bell" size={18} color={colors.primaryDark} />
                <ThemedText variant="bodySm" style={styles.bannerSoftText}>
                    Os times serão notificados do chaveamento e a temporada passa para em andamento.
                </ThemedText>
            </View>

            <Button title="Sortear times" icon="shuffle" loading={creating} onPress={onConfirm} />
            <Button title="Voltar" variant="neutral" disabled={creating} onPress={onBack} />
        </>
    );
}

function BracketContent({ seasonId, modalityId }: { seasonId: string; modalityId: string }) {
    const toast = useToast();
    const season = useSeasonDetails(seasonId);
    const brackets = useBracketsBySeason(seasonId);
    const modalities = useAllModalities();
    const createBracket = useCreateBracket();
    const resortBracket = useResortBracket();
    const [format, setFormat] = useState<ModalityFormat>('KNOCKOUT');
    const [step, setStep] = useState<1 | 2>(1);

    const bracket = brackets.data?.find((item) => item.modality_id === modalityId);
    const canCreate = season.data ? CREATABLE_SEASON_STATUSES.includes(season.data.status) : false;

    const preview = useBracketPreview(canCreate && !bracket ? { modality_id: modalityId, format } : null);
    const details = useBracketDetails(bracket?.bracket_id ?? '');

    if (season.isPending || brackets.isPending) {
        return <LoadingState label="Carregando chaveamento…" />;
    }

    if (season.isError || brackets.isError) {
        const error = season.error ?? brackets.error;
        return (
            <ErrorState
                title="Não foi possível carregar o chaveamento"
                description={friendlyErrorMessage(error, 'Tente de novo.')}
                onRetry={() => {
                    season.refetch();
                    brackets.refetch();
                }}
                retrying={season.isRefetching || brackets.isRefetching}
            />
        );
    }

    const seasonStatus = season.data.status;
    const modalityName =
        bracket?.modality_name ??
        modalities.data?.find((item) => item.modality_id === modalityId)?.name ??
        'Modalidade';

    if (!bracket && !canCreate) {
        return (
            <EmptyState
                title={seasonStatus === 'REGISTRATION_OPEN' ? 'Inscrições abertas' : 'Chaveamento indisponível'}
                description={
                    seasonStatus === 'REGISTRATION_OPEN'
                        ? 'Encerre as inscrições para criar o chaveamento.'
                        : 'A temporada não está em um estado que permita criar chaveamento.'
                }
                actionLabel="Voltar"
                onAction={() => router.back()}
            />
        );
    }

    const handleCreate = async () => {
        try {
            const created = await createBracket.mutateAsync({ modality_id: modalityId, format });
            toast.success(
                created.season_transitioned_to_in_progress
                    ? 'Chaveamento criado. A temporada passou para em andamento.'
                    : 'Chaveamento criado.'
            );
        } catch (error) {
            toast.error(friendlyErrorMessage(error, 'Não foi possível criar o chaveamento.'));
        }
    };

    const confirmResort = () =>
        Alert.alert('Sortear novamente?', 'As partidas atuais serão substituídas pelo novo sorteio.', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Sortear',
                style: 'destructive',
                onPress: async () => {
                    if (!bracket) return;
                    try {
                        await resortBracket.mutateAsync(bracket.bracket_id);
                        toast.success('Chaveamento sorteado novamente.');
                    } catch (error) {
                        toast.error(friendlyErrorMessage(error, 'Não foi possível sortear novamente.'));
                    }
                },
            },
        ]);

    const refreshing = season.isRefetching || brackets.isRefetching || details.isRefetching;
    const refresh = () => {
        season.refetch();
        brackets.refetch();
        modalities.refetch();
        if (bracket) details.refetch();
    };

    if (!bracket) {
        return (
            <>
                <Stack.Screen options={{ title: 'Novo chaveamento' }} />
                <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.wizardContent}>
                    <StepProgress step={step} />

                    {step === 1 ? (
                        <ChooseFormatStep
                            modalityName={modalityName}
                            format={format}
                            onChangeFormat={setFormat}
                            teamCount={preview.data?.team_count ?? null}
                            previewPending={preview.isPending}
                            previewError={preview.isError ? preview.error : null}
                            canContinue={!!preview.data}
                            onContinue={() => setStep(2)}
                        />
                    ) : (
                        <ReviewAndDrawStep
                            modalityName={modalityName}
                            format={format}
                            teamCount={preview.data?.team_count ?? 0}
                            byesEstimated={preview.data?.byes_estimated ?? 0}
                            creating={createBracket.isPending}
                            onConfirm={handleCreate}
                            onBack={() => setStep(1)}
                        />
                    )}
                </ScrollView>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: modalityName }} />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            >
                <Section title="Situação">
                    <InfoRow label="Status" value={BracketStatusLabel[bracket.status]} />
                    <InfoRow label="Formato" value={ModalityFormatLabel[bracket.format]} />
                    <InfoRow
                        label="Partidas"
                        value={`${bracket.finished_matches} de ${bracket.total_matches} finalizadas`}
                    />
                </Section>

                {bracket.available_actions.includes('resort') ? (
                    <Button
                        title="Sortear novamente"
                        variant="warning"
                        icon="shuffle"
                        loading={resortBracket.isPending}
                        onPress={confirmResort}
                    />
                ) : null}

                <Section title="Partidas">
                    {details.isPending ? (
                        <ThemedText variant="body">Carregando partidas…</ThemedText>
                    ) : details.isError ? (
                        <ThemedText variant="body" accessibilityRole="alert">
                            {friendlyErrorMessage(details.error, 'Não foi possível carregar as partidas.')}
                        </ThemedText>
                    ) : details.data && details.data.matches.length > 0 ? (
                        details.data.matches.map((match) => (
                            <MatchRow key={match.match_id} seasonId={seasonId} match={match} />
                        ))
                    ) : (
                        <ThemedText variant="body">Nenhuma partida gerada.</ThemedText>
                    )}
                </Section>
            </ScrollView>
        </>
    );
}

function MatchRow({ seasonId, match }: { seasonId: string; match: BracketMatchResponse }) {
    const schedule =
        match.status === 'IN_PROGRESS'
            ? 'AO VIVO'
            : match.status === 'FINISHED'
              ? 'Finalizada'
              : match.scheduled_date
                ? formatCampusDateTime(match.scheduled_date)
                : 'Sem data';

    return (
        <Link href={`/seasons/${seasonId}/bracket/match/${match.match_id}`} asChild>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${matchTitle(match)}, ${MATCH_STATUS_LABEL[match.status]}. Gerenciar partida`}
            >
                {({ pressed }) => (
                    <View style={[styles.match, { opacity: pressed ? 0.7 : 1 }]}>
                        <View style={styles.matchTexts}>
                            {match.group_name ? <ThemedText variant="caption">{match.group_name}</ThemedText> : null}
                            <ThemedText variant="section" numberOfLines={1}>
                                {matchTitle(match)}
                            </ThemedText>
                            <ThemedText
                                variant="caption"
                                style={match.status === 'IN_PROGRESS' ? styles.matchLive : styles.matchMuted}
                            >
                                {schedule}
                            </ThemedText>
                        </View>
                        <Icon name="edit" size={18} color={colors.textMuted} />
                    </View>
                )}
            </Pressable>
        </Link>
    );
}

export default function BracketManagementScreen() {
    const { id, modalityId } = useLocalSearchParams<{ id: string; modalityId: string }>();

    return (
        <ManagementGuard>
            <BracketContent seasonId={id} modalityId={modalityId} />
        </ManagementGuard>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.md,
    },
    wizardContent: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.lg,
    },
    stepWrapper: {
        gap: spacing.xs,
    },
    stepBars: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    stepBar: {
        flex: 1,
        height: 4,
        borderRadius: radius.pill,
    },
    stepBarActive: {
        backgroundColor: colors.primary,
    },
    stepBarInactive: {
        backgroundColor: colors.border,
    },
    field: {
        gap: spacing.xs,
    },
    fieldBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 52,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    formatList: {
        gap: spacing.sm,
    },
    formatCard: {
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
    formatCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primarySoft,
    },
    formatIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
    },
    formatIconSelected: {
        backgroundColor: colors.primary,
    },
    formatTexts: {
        flex: 1,
        gap: 2,
    },
    formatCheck: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
    },
    formatRadio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: colors.border,
    },
    previewError: {
        color: colors.danger,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.warningSoft,
    },
    bannerWarningText: {
        flex: 1,
        color: colors.warningText,
    },
    bannerSoft: {
        backgroundColor: colors.primarySoft,
    },
    bannerSoftText: {
        flex: 1,
        color: colors.primaryDark,
    },
    match: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    matchTexts: {
        flex: 1,
        gap: 2,
    },
    matchLive: {
        color: colors.danger,
    },
    matchMuted: {
        color: colors.textSecondary,
    },
});
