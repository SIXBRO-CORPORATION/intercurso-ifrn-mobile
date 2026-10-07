import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/button';
import { ManagementGuard } from '@/components/management/management-guard';
import { InfoRow, Section } from '@/components/management/section';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import {
    useBracketDetails,
    useBracketPreview,
    useBracketsBySeason,
    useCreateBracket,
    useDeleteMatch,
    useResortBracket,
} from '@/hooks/useBrackets';
import { useAllModalities } from '@/hooks/useModalities';
import { useSeasonDetails } from '@/hooks/useSeasons';
import { useToast } from '@/providers/ToastProvider';
import type { BracketMatchResponse } from '@/types/bracket';
import { BracketStatusLabel, ModalityFormatLabel, type MatchStatus, type ModalityFormat, type SeasonStatus } from '@/types/enums';
import { colors, radius, spacing, useBrandColors } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';

const FORMATS: ModalityFormat[] = ['KNOCKOUT', 'GROUP_STAGE_KNOCKOUT', 'ROUND_ROBIN', 'TRIANGULAR'];

const CREATABLE_SEASON_STATUSES: SeasonStatus[] = ['REGISTRATION_CLOSED', 'IN_PROGRESS'];

const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
    SCHEDULED: 'Agendada',
    IN_PROGRESS: 'Em andamento',
    FINISHED: 'Finalizada',
};

function matchTitle(match: BracketMatchResponse): string {
    const home = match.team1_name ?? 'A definir';
    const away = match.team2_name ?? 'A definir';
    return `${home} x ${away}`;
}

function FormatOption({ format, selected, onSelect }: { format: ModalityFormat; selected: boolean; onSelect: () => void }) {
    const brand = useBrandColors();
    return (
        <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={ModalityFormatLabel[format]}
            onPress={onSelect}
            style={({ pressed }) => [
                styles.option,
                { borderColor: selected ? brand.primary : 'transparent', opacity: pressed ? 0.7 : 1 },
            ]}
        >
            <ThemedText variant="headline">{ModalityFormatLabel[format]}</ThemedText>
        </Pressable>
    );
}

function BracketContent({ seasonId, modalityId }: { seasonId: string; modalityId: string }) {
    const toast = useToast();
    const season = useSeasonDetails(seasonId);
    const brackets = useBracketsBySeason(seasonId);
    const modalities = useAllModalities();
    const createBracket = useCreateBracket();
    const resortBracket = useResortBracket();
    const deleteMatch = useDeleteMatch();
    const [format, setFormat] = useState<ModalityFormat>('KNOCKOUT');

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

    const confirmCreate = () =>
        Alert.alert(
            'Criar chaveamento?',
            `${modalityName} · ${ModalityFormatLabel[format]}. As partidas serão geradas com base nos times aprovados.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Criar',
                    onPress: async () => {
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
                    },
                },
            ]
        );

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

    const confirmDeleteMatch = (match: BracketMatchResponse) =>
        Alert.alert('Remover partida?', `${matchTitle(match)} será removida do chaveamento.`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Remover',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteMatch.mutateAsync(match.match_id);
                        toast.success('Partida removida.');
                    } catch (error) {
                        toast.error(friendlyErrorMessage(error, 'Não foi possível remover a partida.'));
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

    return (
        <>
            <Stack.Screen options={{ title: modalityName }} />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            >
                {!bracket ? (
                    <>
                        <Section title="Formato">
                            <View style={styles.options}>
                                {FORMATS.map((item) => (
                                    <FormatOption
                                        key={item}
                                        format={item}
                                        selected={format === item}
                                        onSelect={() => setFormat(item)}
                                    />
                                ))}
                            </View>
                        </Section>

                        <Section title="Prévia">
                            {preview.isPending ? (
                                <ThemedText variant="subhead">Calculando sugestão…</ThemedText>
                            ) : preview.isError ? (
                                <ThemedText variant="subhead" accessibilityRole="alert">
                                    {friendlyErrorMessage(preview.error, 'Não foi possível calcular a prévia.')}
                                </ThemedText>
                            ) : preview.data ? (
                                <>
                                    <InfoRow label="Times aprovados" value={String(preview.data.team_count)} />
                                    <InfoRow label="Byes estimados" value={String(preview.data.byes_estimated)} />
                                </>
                            ) : null}
                        </Section>

                        <Button
                            title="Criar chaveamento"
                            disabled={!preview.data}
                            loading={createBracket.isPending}
                            onPress={confirmCreate}
                        />
                    </>
                ) : (
                    <>
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
                                variant="secondary"
                                loading={resortBracket.isPending}
                                onPress={confirmResort}
                            />
                        ) : null}

                        <Section title="Partidas">
                            {details.isPending ? (
                                <ThemedText variant="subhead">Carregando partidas…</ThemedText>
                            ) : details.isError ? (
                                <ThemedText variant="subhead" accessibilityRole="alert">
                                    {friendlyErrorMessage(details.error, 'Não foi possível carregar as partidas.')}
                                </ThemedText>
                            ) : details.data && details.data.matches.length > 0 ? (
                                details.data.matches.map((match) => (
                                    <MatchRow
                                        key={match.match_id}
                                        match={match}
                                        onDelete={() => confirmDeleteMatch(match)}
                                    />
                                ))
                            ) : (
                                <ThemedText variant="subhead">Nenhuma partida gerada.</ThemedText>
                            )}
                        </Section>
                    </>
                )}
            </ScrollView>
        </>
    );
}

function MatchRow({ match, onDelete }: { match: BracketMatchResponse; onDelete: () => void }) {
    const canDelete = match.status === 'SCHEDULED';
    return (
        <View style={styles.match}>
            {match.group_name ? <ThemedText variant="caption">{match.group_name}</ThemedText> : null}
            <ThemedText variant="headline">{matchTitle(match)}</ThemedText>
            <ThemedText variant="caption">{MATCH_STATUS_LABEL[match.status]}</ThemedText>
            {canDelete ? <Button title="Remover partida" variant="ghost" size="sm" onPress={onDelete} /> : null}
        </View>
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
    options: {
        gap: spacing.sm,
    },
    option: {
        padding: spacing.md,
        borderWidth: 2,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.secondarySystemBackground as string,
    },
    match: {
        gap: spacing.xs,
        padding: spacing.md,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.secondarySystemBackground as string,
    },
});
