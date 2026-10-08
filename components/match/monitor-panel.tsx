import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { DateField } from '@/components/form/date-field';
import { Section } from '@/components/management/section';
import { ThemedText } from '@/components/themed-text';
import { useDeleteMatch, useUpdateMatch } from '@/hooks/useBrackets';
import {
    useEndPenaltyShootout,
    useEndPeriod,
    useEndSet,
    useFinishMatch,
    usePauseClock,
    useRegisterCard,
    useRegisterGoal,
    useRegisterPenaltyKick,
    useResumeClock,
    useStartMatch,
    useStartPenaltyShootout,
    useStartPeriod,
    useUndoLastMatchEvent,
} from '@/hooks/useMatches';
import { useToast } from '@/providers/ToastProvider';
import type { MatchPublicPlayerResponse, MatchPublicResponse } from '@/types/match';
import { type CardType, type PenaltyKickResult } from '@/types/enums';
import { spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { isoToPickerDateTime, pickerDateTimeToIso } from '@/utils/campus-time';
import { expelledPlayerIds } from './match-helpers';

function PlayersList({
    players,
    teamName: teamLabel,
    pointLabel,
    expelled,
    disabled,
    onGoal,
    onCard,
}: {
    players: MatchPublicPlayerResponse[];
    teamName: string;
    pointLabel: string;
    expelled: Set<string>;
    disabled: boolean;
    onGoal: (playerId: string) => void;
    onCard: (playerId: string, cardType: CardType) => void;
}) {
    return (
        <View style={styles.teamPlayers}>
            <ThemedText variant="caption" style={styles.teamPlayersTitle}>
                {teamLabel.toUpperCase()}
            </ThemedText>
            {players.length === 0 ? (
                <ThemedText variant="subhead">Nenhum jogador disponível.</ThemedText>
            ) : (
                players.map((player) => {
                    const isExpelled = expelled.has(player.user_id);
                    return (
                        <View key={player.user_id} style={styles.playerRow}>
                            <ThemedText variant="subhead" style={styles.playerName} numberOfLines={1}>
                                {player.name}
                                {isExpelled ? ' · Expulso' : ''}
                            </ThemedText>
                            <View style={styles.playerActions}>
                                <Button
                                    title={pointLabel}
                                    size="sm"
                                    disabled={disabled || isExpelled}
                                    onPress={() => onGoal(player.user_id)}
                                />
                                <Button
                                    title="Amarelo"
                                    size="sm"
                                    variant="secondary"
                                    disabled={disabled || isExpelled}
                                    onPress={() => onCard(player.user_id, 'YELLOW')}
                                />
                                <Button
                                    title="Vermelho"
                                    size="sm"
                                    variant="destructive"
                                    disabled={disabled || isExpelled}
                                    onPress={() => onCard(player.user_id, 'RED')}
                                />
                            </View>
                        </View>
                    );
                })
            )}
        </View>
    );
}

function PenaltyTeamActions({
    teamName: teamLabel,
    disabled,
    onResult,
}: {
    teamName: string;
    disabled: boolean;
    onResult: (result: PenaltyKickResult) => void;
}) {
    return (
        <View style={styles.penaltyTeam}>
            <ThemedText variant="subhead" style={styles.penaltyTeamName} numberOfLines={1}>
                {teamLabel}
            </ThemedText>
            <Button title="Converteu" size="sm" disabled={disabled} onPress={() => onResult('GOAL')} />
            <Button title="Perdeu" size="sm" variant="secondary" disabled={disabled} onPress={() => onResult('MISS')} />
        </View>
    );
}

function ScheduledPanel({ match }: { match: MatchPublicResponse }) {
    const toast = useToast();
    const updateMatch = useUpdateMatch();
    const deleteMatch = useDeleteMatch();
    const startMatch = useStartMatch();
    const [date, setDate] = useState(() => isoToPickerDateTime(match.scheduled_date));

    const handleSaveSchedule = async () => {
        try {
            await updateMatch.mutateAsync({
                matchId: match.match_id,
                request: { scheduled_date: pickerDateTimeToIso(date) },
            });
            toast.success('Agendamento atualizado.');
        } catch (error) {
            toast.error(friendlyErrorMessage(error, 'Não foi possível atualizar o agendamento.'));
        }
    };

    const confirmDelete = () =>
        Alert.alert('Remover partida?', 'Esta partida será removida do chaveamento.', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Remover',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteMatch.mutateAsync(match.match_id);
                        toast.success('Partida removida.');
                        router.back();
                    } catch (error) {
                        toast.error(friendlyErrorMessage(error, 'Não foi possível remover a partida.'));
                    }
                },
            },
        ]);

    return (
        <>
            <Section title="Agendamento">
                <DateField
                    label="Data e horário"
                    value={date}
                    onChange={setDate}
                    minimumDate={new Date()}
                    mode="datetime"
                />
                <Button
                    title="Salvar agendamento"
                    variant="secondary"
                    loading={updateMatch.isPending}
                    onPress={handleSaveSchedule}
                />
            </Section>

            <Button
                title="Iniciar partida"
                loading={startMatch.isPending}
                onPress={async () => {
                    try {
                        await startMatch.mutateAsync({ matchId: match.match_id });
                        toast.success('Partida iniciada.');
                    } catch (error) {
                        toast.error(friendlyErrorMessage(error, 'Não foi possível iniciar a partida.'));
                    }
                }}
            />

            <Button title="Remover partida" variant="ghost" loading={deleteMatch.isPending} onPress={confirmDelete} />
        </>
    );
}

function InProgressPanel({ match }: { match: MatchPublicResponse }) {
    const toast = useToast();
    const registerGoal = useRegisterGoal();
    const registerCard = useRegisterCard();
    const pauseClock = usePauseClock();
    const resumeClock = useResumeClock();
    const startPeriod = useStartPeriod();
    const endPeriod = useEndPeriod();
    const endSet = useEndSet();
    const finishMatch = useFinishMatch();
    const startPenaltyShootout = useStartPenaltyShootout();
    const registerPenaltyKick = useRegisterPenaltyKick();
    const endPenaltyShootout = useEndPenaltyShootout();
    const undoLastEvent = useUndoLastMatchEvent();

    const run = async (action: () => Promise<unknown>, successMessage: string | undefined, fallbackError: string) => {
        try {
            await action();
            if (successMessage) toast.success(successMessage);
        } catch (error) {
            toast.error(friendlyErrorMessage(error, fallbackError));
        }
    };

    const isVolleyball = match.modality_configuration?.score_type === 'SETS';
    const pointLabel = match.modality_configuration?.score_type === 'GOALS' ? 'Gol' : 'Ponto';
    const expelled = expelledPlayerIds(match);

    const confirmEndPeriod = () =>
        Alert.alert('Encerrar período?', `Finalizar o ${match.current_period}º período.`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Encerrar',
                onPress: () =>
                    run(
                        () => endPeriod.mutateAsync({ matchId: match.match_id }),
                        'Período encerrado.',
                        'Não foi possível encerrar o período.'
                    ),
            },
        ]);

    const confirmEndSet = () =>
        Alert.alert('Encerrar set?', 'O set atual será registrado no histórico da partida.', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Encerrar',
                onPress: () =>
                    run(() => endSet.mutateAsync({ matchId: match.match_id }), 'Set encerrado.', 'Não foi possível encerrar o set.'),
            },
        ]);

    const confirmEndPenaltyShootout = () =>
        Alert.alert('Encerrar disputa de pênaltis?', 'A disputa será encerrada com o placar atual.', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Encerrar',
                onPress: () =>
                    run(
                        () => endPenaltyShootout.mutateAsync({ matchId: match.match_id }),
                        'Disputa de pênaltis encerrada.',
                        'Não foi possível encerrar a disputa de pênaltis.'
                    ),
            },
        ]);

    const confirmUndo = () =>
        Alert.alert('Desfazer último evento?', 'O último evento registrado nesta partida será removido.', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Desfazer',
                style: 'destructive',
                onPress: () =>
                    run(
                        () => undoLastEvent.mutateAsync({ matchId: match.match_id }),
                        'Último evento desfeito.',
                        'Não foi possível desfazer o evento.'
                    ),
            },
        ]);

    const confirmFinish = () =>
        Alert.alert('Finalizar partida?', 'A partida será encerrada e o resultado não poderá ser alterado por aqui.', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Finalizar',
                style: 'destructive',
                onPress: () =>
                    run(
                        () => finishMatch.mutateAsync({ matchId: match.match_id }),
                        'Partida finalizada.',
                        'Não foi possível finalizar a partida.'
                    ),
            },
        ]);

    return (
        <>
            <Section title="Cronômetro e período">
                <View style={styles.actionsRow}>
                    <Button
                        title={match.clock_running ? 'Pausar' : 'Retomar'}
                        variant="secondary"
                        size="sm"
                        loading={pauseClock.isPending || resumeClock.isPending}
                        onPress={() =>
                            match.clock_running
                                ? run(
                                      () => pauseClock.mutateAsync({ matchId: match.match_id }),
                                      undefined,
                                      'Não foi possível pausar o cronômetro.'
                                  )
                                : run(
                                      () => resumeClock.mutateAsync({ matchId: match.match_id }),
                                      undefined,
                                      'Não foi possível retomar o cronômetro.'
                                  )
                        }
                    />
                    {isVolleyball ? (
                        <Button title="Encerrar set" variant="secondary" size="sm" loading={endSet.isPending} onPress={confirmEndSet} />
                    ) : (
                        <>
                            <Button
                                title="Iniciar período"
                                variant="secondary"
                                size="sm"
                                loading={startPeriod.isPending}
                                onPress={() =>
                                    run(
                                        () => startPeriod.mutateAsync({ matchId: match.match_id }),
                                        'Período iniciado.',
                                        'Não foi possível iniciar o período.'
                                    )
                                }
                            />
                            <Button
                                title="Encerrar período"
                                variant="secondary"
                                size="sm"
                                loading={endPeriod.isPending}
                                onPress={confirmEndPeriod}
                            />
                        </>
                    )}
                </View>
            </Section>

            <Section title="Jogadores">
                <PlayersList
                    players={match.team1_players}
                    teamName={match.team1.name}
                    pointLabel={pointLabel}
                    expelled={expelled}
                    disabled={registerGoal.isPending || registerCard.isPending}
                    onGoal={(playerId) =>
                        run(
                            () =>
                                registerGoal.mutateAsync({
                                    matchId: match.match_id,
                                    request: { team_id: match.team1.team_id, player_id: playerId },
                                }),
                            undefined,
                            `Não foi possível registrar o ${pointLabel.toLowerCase()}.`
                        )
                    }
                    onCard={(playerId, cardType) =>
                        run(
                            () =>
                                registerCard.mutateAsync({
                                    matchId: match.match_id,
                                    request: { team_id: match.team1.team_id, player_id: playerId, card_type: cardType },
                                }),
                            undefined,
                            'Não foi possível registrar o cartão.'
                        )
                    }
                />
                <View style={styles.playersDivider} />
                <PlayersList
                    players={match.team2_players}
                    teamName={match.team2.name}
                    pointLabel={pointLabel}
                    expelled={expelled}
                    disabled={registerGoal.isPending || registerCard.isPending}
                    onGoal={(playerId) =>
                        run(
                            () =>
                                registerGoal.mutateAsync({
                                    matchId: match.match_id,
                                    request: { team_id: match.team2.team_id, player_id: playerId },
                                }),
                            undefined,
                            `Não foi possível registrar o ${pointLabel.toLowerCase()}.`
                        )
                    }
                    onCard={(playerId, cardType) =>
                        run(
                            () =>
                                registerCard.mutateAsync({
                                    matchId: match.match_id,
                                    request: { team_id: match.team2.team_id, player_id: playerId, card_type: cardType },
                                }),
                            undefined,
                            'Não foi possível registrar o cartão.'
                        )
                    }
                />
            </Section>

            {match.match_category === 'KNOCKOUT' ? (
                <Section title="Disputa de pênaltis">
                    {match.penalty_shootout_active ? (
                        <>
                            <PenaltyTeamActions
                                teamName={match.team1.name}
                                disabled={registerPenaltyKick.isPending}
                                onResult={(result) =>
                                    run(
                                        () =>
                                            registerPenaltyKick.mutateAsync({
                                                matchId: match.match_id,
                                                request: { team_id: match.team1.team_id, result },
                                            }),
                                        undefined,
                                        'Não foi possível registrar a cobrança.'
                                    )
                                }
                            />
                            <PenaltyTeamActions
                                teamName={match.team2.name}
                                disabled={registerPenaltyKick.isPending}
                                onResult={(result) =>
                                    run(
                                        () =>
                                            registerPenaltyKick.mutateAsync({
                                                matchId: match.match_id,
                                                request: { team_id: match.team2.team_id, result },
                                            }),
                                        undefined,
                                        'Não foi possível registrar a cobrança.'
                                    )
                                }
                            />
                            <Button
                                title="Encerrar disputa de pênaltis"
                                variant="secondary"
                                loading={endPenaltyShootout.isPending}
                                onPress={confirmEndPenaltyShootout}
                            />
                        </>
                    ) : (
                        <Button
                            title="Iniciar disputa de pênaltis"
                            variant="secondary"
                            loading={startPenaltyShootout.isPending}
                            onPress={() =>
                                run(
                                    () => startPenaltyShootout.mutateAsync({ matchId: match.match_id }),
                                    'Disputa de pênaltis iniciada.',
                                    'Não foi possível iniciar a disputa de pênaltis.'
                                )
                            }
                        />
                    )}
                </Section>
            ) : null}

            <Section title="Outras ações">
                <Button
                    title="Desfazer último evento"
                    variant="ghost"
                    disabled={match.timeline.length === 0}
                    loading={undoLastEvent.isPending}
                    onPress={confirmUndo}
                />
                <Button title="Finalizar partida" variant="destructive" loading={finishMatch.isPending} onPress={confirmFinish} />
            </Section>
        </>
    );
}

export function MonitorPanel({ match }: { match: MatchPublicResponse }) {
    if (match.status === 'SCHEDULED') return <ScheduledPanel match={match} />;
    if (match.status === 'IN_PROGRESS') return <InProgressPanel match={match} />;
    return null;
}

const styles = StyleSheet.create({
    actionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    teamPlayers: {
        gap: spacing.xs,
    },
    teamPlayersTitle: {
        marginBottom: spacing.xs,
    },
    playersDivider: {
        height: spacing.sm,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
        minHeight: 36,
    },
    playerName: {
        flex: 1,
    },
    playerActions: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    penaltyTeam: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    penaltyTeamName: {
        flex: 1,
    },
});
