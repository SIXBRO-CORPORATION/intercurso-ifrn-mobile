import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { Section } from '@/components/management/section';
import { BottomSheet, type BottomSheetHandle } from '@/components/overlays/bottom-sheet';
import { ConfirmDialog } from '@/components/overlays/confirm-dialog';
import { MemberAvatar } from '@/components/teams/member-card';
import { ThemedText } from '@/components/themed-text';
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
import { colors, radius, shadows, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { expelledPlayerIds } from './match-helpers';

const EMPTY_EXPELLED: ReadonlySet<string> = new Set();

function PlayerPill({
    player,
    expelled,
    disabled,
    onPress,
}: {
    player: MatchPublicPlayerResponse;
    expelled: boolean;
    disabled?: boolean;
    onPress?: () => void;
}) {
    const pill = (
        <View style={[styles.playerPill, expelled && styles.playerPillExpelled]}>
            <MemberAvatar name={player.name} size={32} />
            <ThemedText variant="body" numberOfLines={1} style={styles.playerPillName}>
                {player.name}
            </ThemedText>
            {expelled ? <Icon name="card" size={14} color={colors.danger} /> : null}
        </View>
    );

    if (!onPress) {
        return <View style={styles.playerPillSlot}>{pill}</View>;
    }

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Registrar evento para ${player.name}${expelled ? ', expulso' : ''}`}
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [styles.playerPillSlot, { opacity: pressed && !disabled ? 0.7 : 1 }]}
        >
            {pill}
        </Pressable>
    );
}

function PlayersList({
    players,
    teamName,
    pointLabel = 'Gol',
    expelled = EMPTY_EXPELLED,
    disabled = false,
    readOnly = false,
    onGoal,
    onCard,
}: {
    players: MatchPublicPlayerResponse[];
    teamName?: string;
    pointLabel?: string;
    expelled?: ReadonlySet<string>;
    disabled?: boolean;
    readOnly?: boolean;
    onGoal?: (playerId: string) => void;
    onCard?: (playerId: string, cardType: CardType) => void;
}) {
    const sheetRef = useRef<BottomSheetHandle>(null);
    const [selected, setSelected] = useState<MatchPublicPlayerResponse | null>(null);

    const openFor = (player: MatchPublicPlayerResponse) => {
        setSelected(player);
        sheetRef.current?.present();
    };

    const pick = (action?: () => void) => {
        sheetRef.current?.dismiss();
        action?.();
    };

    return (
        <View style={styles.teamPlayers}>
            {teamName ? (
                <ThemedText variant="caption" style={styles.teamPlayersTitle}>
                    {teamName.toUpperCase()}
                </ThemedText>
            ) : null}

            {players.length === 0 ? (
                <ThemedText variant="body" style={styles.emptyPlayers}>
                    Nenhum jogador disponível.
                </ThemedText>
            ) : (
                <View style={styles.playersGrid}>
                    {players.map((player) => (
                        <PlayerPill
                            key={player.user_id}
                            player={player}
                            expelled={expelled.has(player.user_id)}
                            disabled={disabled}
                            onPress={readOnly ? undefined : () => openFor(player)}
                        />
                    ))}
                </View>
            )}

            {readOnly ? null : (
                <BottomSheet ref={sheetRef} snapPoints={['42%']} onDismiss={() => setSelected(null)}>
                    {selected ? (
                        <>
                            <View style={styles.sheetHeader}>
                                <MemberAvatar name={selected.name} size={44} />
                                <View style={styles.sheetHeaderTexts}>
                                    <ThemedText variant="section" numberOfLines={1}>
                                        {selected.name}
                                    </ThemedText>
                                    <ThemedText variant="body" style={styles.sheetHeaderSubtitle} numberOfLines={1}>
                                        {teamName ? `${teamName} · registrando evento` : 'Registrando evento'}
                                    </ThemedText>
                                </View>
                            </View>

                            <Button
                                title={pointLabel}
                                icon="ball"
                                disabled={disabled}
                                onPress={() => pick(() => onGoal?.(selected.user_id))}
                            />
                            <Button
                                title="Cartão amarelo"
                                variant="warning"
                                icon="card"
                                disabled={disabled}
                                onPress={() => pick(() => onCard?.(selected.user_id, 'YELLOW'))}
                            />
                            <Button
                                title="Cartão vermelho"
                                variant="danger"
                                icon="card"
                                disabled={disabled}
                                onPress={() => pick(() => onCard?.(selected.user_id, 'RED'))}
                            />
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Cancelar"
                                onPress={() => sheetRef.current?.dismiss()}
                                style={styles.sheetCancel}
                            >
                                <ThemedText variant="body" style={styles.sheetCancelText}>
                                    Cancelar
                                </ThemedText>
                            </Pressable>
                        </>
                    ) : null}
                </BottomSheet>
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
            <Button title="Converteu" size="small" disabled={disabled} onPress={() => onResult('GOAL')} />
            <Button title="Perdeu" size="small" variant="neutral" disabled={disabled} onPress={() => onResult('MISS')} />
        </View>
    );
}

function ScheduledPanel({ match }: { match: MatchPublicResponse }) {
    const toast = useToast();
    const startMatch = useStartMatch();
    const [confirmOpen, setConfirmOpen] = useState(false);

    const lineup = [...match.team1_players, ...match.team2_players];

    const handleStart = async () => {
        try {
            await startMatch.mutateAsync({ matchId: match.match_id });
            setConfirmOpen(false);
            toast.success('Partida iniciada.');
        } catch (error) {
            setConfirmOpen(false);
            toast.error(friendlyErrorMessage(error, 'Não foi possível iniciar a partida.'));
        }
    };

    return (
        <>
            <View style={styles.startWrap}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Iniciar partida"
                    onPress={() => setConfirmOpen(true)}
                    style={({ pressed }) => [styles.startButton, { opacity: pressed ? 0.9 : 1 }]}
                >
                    <Icon name="play" size={30} color={colors.surface} />
                </Pressable>
                <ThemedText variant="body" style={styles.startLabel}>
                    Toque para iniciar
                </ThemedText>
            </View>

            <Section title="Escalações">
                <PlayersList players={lineup} readOnly />
            </Section>

            <ConfirmDialog
                visible={confirmOpen}
                title="Começar partida?"
                description="O cronômetro vai iniciar e os alunos receberão a notificação de início de jogo."
                confirmLabel="Começar"
                cancelLabel="Cancelar"
                confirming={startMatch.isPending}
                onConfirm={handleStart}
                onCancel={() => setConfirmOpen(false)}
            />
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
                        variant="neutral"
                        size="small"
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
                        <Button title="Encerrar set" variant="neutral" size="small" loading={endSet.isPending} onPress={confirmEndSet} />
                    ) : (
                        <>
                            <Button
                                title="Iniciar período"
                                variant="neutral"
                                size="small"
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
                                variant="neutral"
                                size="small"
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
                                variant="neutral"
                                loading={endPenaltyShootout.isPending}
                                onPress={confirmEndPenaltyShootout}
                            />
                        </>
                    ) : (
                        <Button
                            title="Iniciar disputa de pênaltis"
                            variant="neutral"
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
                    variant="outline"
                    disabled={match.timeline.length === 0}
                    loading={undoLastEvent.isPending}
                    onPress={confirmUndo}
                />
                <Button title="Finalizar partida" variant="danger" loading={finishMatch.isPending} onPress={confirmFinish} />
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
    startWrap: {
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg,
    },
    startButton: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        boxShadow: shadows.primaryButton,
    },
    startLabel: {
        color: colors.textSecondary,
    },
    teamPlayers: {
        gap: spacing.xs,
    },
    teamPlayersTitle: {
        marginBottom: spacing.xs,
    },
    emptyPlayers: {
        color: colors.textSecondary,
        textAlign: 'center',
        paddingVertical: spacing.sm,
    },
    playersDivider: {
        height: spacing.sm,
    },
    playersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    playerPillSlot: {
        width: '48%',
    },
    playerPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        minHeight: 48,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.pill,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    playerPillExpelled: {
        backgroundColor: colors.dangerSoft,
    },
    playerPillName: {
        flex: 1,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    sheetHeaderTexts: {
        flex: 1,
        gap: 2,
    },
    sheetHeaderSubtitle: {
        color: colors.textSecondary,
    },
    sheetCancel: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    sheetCancelText: {
        color: colors.textSecondary,
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
