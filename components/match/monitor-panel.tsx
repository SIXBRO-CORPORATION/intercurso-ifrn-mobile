import { useRef, useState, type RefObject } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ListRow, ListRowIcon } from '@/components/list-row';
import { Section } from '@/components/management/section';
import { Segmented } from '@/components/form/segmented';
import { BottomSheet, type BottomSheetHandle } from '@/components/overlays/bottom-sheet';
import { ConfirmDialog } from '@/components/overlays/confirm-dialog';
import { MemberAvatar } from '@/components/teams/member-card';
import { ThemedText } from '@/components/themed-text';
import { useStartMatch } from '@/hooks/useMatches';
import { useInProgressMatchActions } from '@/hooks/useInProgressMatchActions';
import { useToast } from '@/providers/ToastProvider';
import type { MatchPublicPlayerResponse, MatchPublicResponse } from '@/types/match';
import type { CardType, PenaltyKickResult } from '@/types/enums';
import { colors, radius, shadows, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { clockLabel, expelledPlayerIds, cautionedPlayerIds, playerName, teamName } from './match-helpers';

const EMPTY_EXPELLED: ReadonlySet<string> = new Set();

interface PenaltyKickRow {
    id: string;
    teamLabel: string;
    playerLabel: string;
    made: boolean;
    ordinalLabel: string;
}

function penaltyKickRows(match: MatchPublicResponse): PenaltyKickRow[] {
    const counts = new Map<string, number>();
    const rows: PenaltyKickRow[] = [];

    for (const event of match.timeline) {
        if (event.event_type !== 'PENALTY_GOAL' && event.event_type !== 'PENALTY_MISS') continue;

        const teamId = event.team_id ?? '';
        const ordinal = (counts.get(teamId) ?? 0) + 1;
        counts.set(teamId, ordinal);

        rows.push({
            id: event.event_id,
            teamLabel: teamName(match, event.team_id) ?? '',
            playerLabel: playerName(match, event.player_id) ?? 'Jogador',
            made: event.event_type === 'PENALTY_GOAL',
            ordinalLabel: `${ordinal}ª cobrança`,
        });
    }

    return rows;
}


function PlayerPill({
    player,
    expelled,
    cautioned,
    disabled,
    onPress,
}: {
    player: MatchPublicPlayerResponse;
    expelled: boolean;
    cautioned?: boolean;
    disabled?: boolean;
    onPress?: () => void;
}) {
    const pill = (
        <View
            style={[
                styles.playerPill,
                cautioned && !expelled && styles.playerPillCautioned,
                expelled && styles.playerPillExpelled,
            ]}
        >
            <MemberAvatar name={player.name} size={32} />
            <ThemedText variant="body" numberOfLines={1} style={styles.playerPillName}>
                {player.name}
            </ThemedText>
            {expelled ? (
                <Icon name="card" size={14} color={colors.danger} />
            ) : cautioned ? (
                <Icon name="card" size={14} color={colors.warningText} />
            ) : null}
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
    cautioned = EMPTY_EXPELLED,
    clockSeconds,
    disabled = false,
    readOnly = false,
    onGoal,
    onCard,
}: {
    players: MatchPublicPlayerResponse[];
    teamName?: string;
    pointLabel?: string;
    expelled?: ReadonlySet<string>;
    cautioned?: ReadonlySet<string>;
    clockSeconds?: number;
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
                            cautioned={cautioned.has(player.user_id)}
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
                                        {(() => {
                                            const at = clockSeconds != null ? ` aos ${clockLabel(clockSeconds)}` : '';
                                            return teamName ? `${teamName} · registrando${at}` : `Registrando${at}`;
                                        })()}
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
        <View style={styles.penaltyTeamColumn}>
            <ThemedText variant="label" numberOfLines={1} style={styles.penaltyTeamLabel}>
                {teamLabel}
            </ThemedText>
            <Button title="Gol" icon="check" disabled={disabled} onPress={() => onResult('GOAL')} />
            <Button title="Perdeu" icon="close" variant="dangerSoft" disabled={disabled} onPress={() => onResult('MISS')} />
        </View>
    );
}

function PenaltyScoreTally({ match }: { match: MatchPublicResponse }) {
    return (
        <View style={styles.penaltyTally}>
            <ThemedText variant="heading">{match.team1.penalty_score ?? 0}</ThemedText>
            <ThemedText variant="body" style={styles.penaltyTallyDash}>
                ×
            </ThemedText>
            <ThemedText variant="heading">{match.team2.penalty_score ?? 0}</ThemedText>
        </View>
    );
}

function PenaltyKicksList({ match }: { match: MatchPublicResponse }) {
    const rows = penaltyKickRows(match);
    if (rows.length === 0) return null;

    return (
        <View style={styles.kicksList}>
            <ThemedText variant="label" style={styles.kicksTitle}>
                Cobranças
            </ThemedText>
            {rows.map((row) => (
                <ListRow
                    key={row.id}
                    leading={
                        <ListRowIcon background={row.made ? colors.primary : colors.danger} size={40}>
                            <Icon name={row.made ? 'check' : 'close'} size={18} color={colors.surface} />
                        </ListRowIcon>
                    }
                    title={`${row.teamLabel} · ${row.playerLabel}`}
                    trailing={
                        <ThemedText variant="caption" style={styles.kickOrdinal}>
                            {row.ordinalLabel}
                        </ThemedText>
                    }
                />
            ))}
        </View>
    );
}

function SetsPreviousList({ match }: { match: MatchPublicResponse }) {
    if (match.sets.length === 0) return null;

    return (
        <View style={styles.setsRow}>
            <ThemedText variant="label" style={styles.setsRowTitle}>
                Sets anteriores
            </ThemedText>
            <View style={styles.setsChips}>
                {match.sets.map((set) => (
                    <View key={set.set_number} style={styles.setChip}>
                        <ThemedText variant="section">
                            {set.team1_points} – {set.team2_points}
                        </ThemedText>
                        <ThemedText variant="caption" style={styles.setChipLabel}>
                            Set {set.set_number}
                        </ThemedText>
                    </View>
                ))}
            </View>
        </View>
    );
}

function VolleyballPointSheet({
    sheetRef,
    teamLabel,
    players,
    disabled,
    onSelect,
}: {
    sheetRef: RefObject<BottomSheetHandle | null>;
    teamLabel: string;
    players: MatchPublicPlayerResponse[];
    disabled?: boolean;
    onSelect: (playerId: string) => void;
}) {
    return (
        <BottomSheet ref={sheetRef} title={`Ponto · ${teamLabel}`} snapPoints={['50%']}>
            <View style={styles.volleySheetList}>
                {players.length === 0 ? (
                    <ThemedText variant="body" style={styles.emptyPlayers}>
                        Nenhum jogador disponível.
                    </ThemedText>
                ) : (
                    players.map((player) => (
                        <Pressable
                            key={player.user_id}
                            accessibilityRole="button"
                            accessibilityLabel={`Registrar ponto de ${player.name}`}
                            disabled={disabled}
                            onPress={() => {
                                sheetRef.current?.dismiss();
                                onSelect(player.user_id);
                            }}
                            style={({ pressed }) => [styles.volleySheetRow, { opacity: pressed && !disabled ? 0.7 : 1 }]}
                        >
                            <MemberAvatar name={player.name} size={32} />
                            <ThemedText variant="body" numberOfLines={1} style={styles.volleySheetRowName}>
                                {player.name}
                            </ThemedText>
                            <Icon name="chev_r" size={18} color={colors.textMuted} />
                        </Pressable>
                    ))
                )}
            </View>
        </BottomSheet>
    );
}

function VolleyTeamButton({
    teamName: teamLabel,
    disabled,
    onPress,
}: {
    teamName: string;
    disabled?: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Registrar ponto para ${teamLabel}`}
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [styles.volleyButtonSlot, { opacity: pressed && !disabled ? 0.9 : 1 }]}
        >
            <LinearGradient colors={colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.volleyButton}>
                <View style={styles.volleyButtonTop}>
                    <Icon name="plus" size={18} color={colors.surface} />
                    <ThemedText variant="button" style={styles.volleyButtonLabel}>
                        Ponto
                    </ThemedText>
                </View>
                <ThemedText variant="caption" numberOfLines={1} style={styles.volleyButtonTeam}>
                    {teamLabel}
                </ThemedText>
            </LinearGradient>
        </Pressable>
    );
}

function VolleyballScoring({
    match,
    disabled,
    onPoint,
}: {
    match: MatchPublicResponse;
    disabled?: boolean;
    onPoint: (teamId: string, playerId: string) => void;
}) {
    const team1Sheet = useRef<BottomSheetHandle>(null);
    const team2Sheet = useRef<BottomSheetHandle>(null);

    return (
        <>
            <SetsPreviousList match={match} />

            <View style={styles.volleyButtonsRow}>
                <VolleyTeamButton teamName={match.team1.name} disabled={disabled} onPress={() => team1Sheet.current?.present()} />
                <VolleyTeamButton teamName={match.team2.name} disabled={disabled} onPress={() => team2Sheet.current?.present()} />
            </View>

            <VolleyballPointSheet
                sheetRef={team1Sheet}
                teamLabel={match.team1.name}
                players={match.team1_players}
                disabled={disabled}
                onSelect={(playerId) => onPoint(match.team1.team_id, playerId)}
            />
            <VolleyballPointSheet
                sheetRef={team2Sheet}
                teamLabel={match.team2.name}
                players={match.team2_players}
                disabled={disabled}
                onSelect={(playerId) => onPoint(match.team2.team_id, playerId)}
            />
        </>
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

function FinishMatchSheet({
    sheetRef,
    match,
    isVolleyball,
    finishing,
    onFinish,
}: {
    sheetRef: RefObject<BottomSheetHandle | null>;
    match: MatchPublicResponse;
    isVolleyball: boolean;
    finishing: boolean;
    onFinish: () => void;
}) {
    const score1 = isVolleyball ? (match.team1.sets_won ?? 0) : match.team1.score;
    const score2 = isVolleyball ? (match.team2.sets_won ?? 0) : match.team2.score;

    let winnerName: string | null = null;
    if (score1 !== score2) {
        winnerName = score1 > score2 ? match.team1.name : match.team2.name;
    } else {
        const penalty1 = match.team1.penalty_score ?? 0;
        const penalty2 = match.team2.penalty_score ?? 0;
        if (penalty1 !== penalty2) {
            winnerName = penalty1 > penalty2 ? match.team1.name : match.team2.name;
        }
    }

    return (
        <BottomSheet ref={sheetRef} title="Finalizar partida?" snapPoints={['46%']}>
            <View style={styles.finishCard}>
                <View style={styles.finishCardTeams}>
                    <ThemedText variant="section" numberOfLines={1} style={styles.finishCardTeamName}>
                        {match.team1.name}
                    </ThemedText>
                    <ThemedText variant="section" numberOfLines={1} style={[styles.finishCardTeamName, styles.finishCardTeamNameRight]}>
                        {match.team2.name}
                    </ThemedText>
                </View>
                <ThemedText variant="title" style={styles.finishCardScore}>
                    {score1} × {score2}
                </ThemedText>
                {winnerName ? (
                    <View style={styles.finishWinnerPill}>
                        <ThemedText variant="caption" style={styles.finishWinnerLabel}>
                            Vencedor: {winnerName}
                        </ThemedText>
                    </View>
                ) : null}
            </View>

            <Button title="Finalizar partida" icon="flag" loading={finishing} onPress={onFinish} />
            <Button title="Voltar ao jogo" variant="neutral" disabled={finishing} onPress={() => sheetRef.current?.dismiss()} />
        </BottomSheet>
    );
}

function InProgressPanel({ match }: { match: MatchPublicResponse }) {
    const {
        registerGoal,
        registerCard,
        pauseClock,
        resumeClock,
        startPeriod,
        endPeriod,
        endSet,
        finishMatch,
        startPenaltyShootout,
        registerPenaltyKick,
        endPenaltyShootout,
        undoLastEvent,
        undoConfirmOpen,
        setUndoConfirmOpen,
        selectedTeamId,
        setSelectedTeamId,
        finishSheetRef,
        pendingAction,
        setPendingAction,
        run,
        isVolleyball,
        pointLabel,
        confirmEndPeriod,
        confirmEndSet,
        confirmEndPenaltyShootout,
        confirmStartPenaltyShootout,
        pendingActionBusy,
        handlePendingActionConfirm,
        handleUndo,
        handleFinish,
        undoDialog,
        pendingActionCopy,
    } = useInProgressMatchActions(match);

    const expelled = expelledPlayerIds(match);
    const cautioned = cautionedPlayerIds(match);

    return (
        <>
            <Section title="Cronômetro e período">
                <View style={styles.actionsRow}>
                    <Button
                        title={match.clock_running ? 'Pausar' : 'Retomar'}
                        variant="neutral"
                        size="small"
                        icon={match.clock_running ? 'pause' : 'play'}
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
                    {isVolleyball ? null : (
                        <>
                            <Button
                                title="Iniciar período"
                                variant="neutral"
                                size="small"
                                icon="play"
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
                                title="Fim do tempo"
                                variant="neutral"
                                size="small"
                                icon="clock"
                                loading={endPeriod.isPending}
                                onPress={confirmEndPeriod}
                            />
                            <Button
                                title="Desfazer"
                                variant="neutral"
                                size="small"
                                icon="undo"
                                disabled={match.timeline.length === 0}
                                loading={undoLastEvent.isPending}
                                onPress={() => setUndoConfirmOpen(true)}
                            />
                        </>
                    )}
                </View>
            </Section>

            {isVolleyball ? (
                <Section title="Pontuação">
                    <VolleyballScoring
                        match={match}
                        disabled={registerGoal.isPending}
                        onPoint={(teamId, playerId) =>
                            run(
                                () =>
                                    registerGoal.mutateAsync({
                                        matchId: match.match_id,
                                        request: { team_id: teamId, player_id: playerId },
                                    }),
                                undefined,
                                `Não foi possível registrar o ${pointLabel.toLowerCase()}.`
                            )
                        }
                    />
                    <View style={styles.volleyQuickActions}>
                        <Button
                            title="Desfazer"
                            variant="outline"
                            size="compact"
                            icon="undo"
                            disabled={match.timeline.length === 0}
                            loading={undoLastEvent.isPending}
                            onPress={() => setUndoConfirmOpen(true)}
                            style={styles.volleyQuickActionButton}
                        />
                        <Button
                            title="Fim do set"
                            variant="warning"
                            size="compact"
                            icon="flag"
                            loading={endSet.isPending}
                            onPress={confirmEndSet}
                            style={styles.volleyQuickActionButton}
                        />
                    </View>
                </Section>
            ) : (
                <Section title="Jogadores">
                    <Segmented
                        options={[
                            { label: match.team1.name, value: match.team1.team_id },
                            { label: match.team2.name, value: match.team2.team_id },
                        ]}
                        value={selectedTeamId}
                        onChange={setSelectedTeamId}
                    />
                    {selectedTeamId === match.team1.team_id ? (
                        <PlayersList
                            players={match.team1_players}
                            teamName={match.team1.name}
                            pointLabel={pointLabel}
                            expelled={expelled}
                            cautioned={cautioned}
                            clockSeconds={match.clock_seconds}
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
                    ) : (
                        <PlayersList
                            players={match.team2_players}
                            teamName={match.team2.name}
                            pointLabel={pointLabel}
                            expelled={expelled}
                            cautioned={cautioned}
                            clockSeconds={match.clock_seconds}
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
                    )}
                </Section>
            )}

            {match.match_category === 'KNOCKOUT' ? (
                <Section title="Disputa de pênaltis">
                    {match.penalty_shootout_active ? (
                        <>
                            <View style={styles.officialScoreRow}>
                                <ThemedText variant="overline" style={styles.officialScoreLabel}>
                                    Placar oficial
                                </ThemedText>
                                <ThemedText variant="body">
                                    {match.team1.name} {match.team1.score} × {match.team2.score} {match.team2.name}
                                </ThemedText>
                            </View>
                            <PenaltyScoreTally match={match} />
                            <View style={styles.penaltyTeamsRow}>
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
                            </View>

                            <PenaltyKicksList match={match} />

                            <Button
                                title="Encerrar disputa de pênaltis"
                                variant="neutral"
                                icon="flag"
                                loading={endPenaltyShootout.isPending}
                                onPress={confirmEndPenaltyShootout}
                            />
                        </>
                    ) : (
                        <Button
                            title="Iniciar disputa de pênaltis"
                            variant="neutral"
                            icon="shuffle"
                            loading={startPenaltyShootout.isPending}
                            onPress={confirmStartPenaltyShootout}
                        />
                    )}
                </Section>
            ) : null}

            <Section title="Outras ações">
                <Button
                    title="Finalizar partida"
                    variant="dark"
                    icon="flag"
                    loading={finishMatch.isPending}
                    onPress={() => finishSheetRef.current?.present()}
                />
            </Section>

            <ConfirmDialog
                visible={undoConfirmOpen}
                title={undoDialog.title}
                description={undoDialog.description}
                confirmLabel="Confirmar"
                cancelLabel="Cancelar"
                tone="danger"
                confirming={undoLastEvent.isPending}
                onConfirm={handleUndo}
                onCancel={() => setUndoConfirmOpen(false)}
            />

            <ConfirmDialog
                visible={pendingAction !== null}
                title={pendingAction ? pendingActionCopy[pendingAction].title : ''}
                description={pendingAction ? pendingActionCopy[pendingAction].description : ''}
                confirmLabel="Confirmar"
                cancelLabel="Cancelar"
                tone={pendingAction === 'startPenaltyShootout' ? 'primary' : 'danger'}
                confirming={pendingActionBusy}
                onConfirm={handlePendingActionConfirm}
                onCancel={() => setPendingAction(null)}
            />

            <FinishMatchSheet
                sheetRef={finishSheetRef}
                match={match}
                isVolleyball={isVolleyball}
                finishing={finishMatch.isPending}
                onFinish={handleFinish}
            />
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
    playerPillCautioned: {
        backgroundColor: colors.warningSoft,
    },
    officialScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.md,
        backgroundColor: colors.field,
    },
    officialScoreLabel: {
        color: colors.textSecondary,
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
    penaltyTally: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.xs,
    },
    penaltyTallyDash: {
        color: colors.textSecondary,
    },
    penaltyTeamsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    penaltyTeamColumn: {
        flex: 1,
        gap: spacing.xs,
    },
    penaltyTeamLabel: {
        textAlign: 'center',
        color: colors.textSecondary,
    },
    kicksList: {
        gap: spacing.xs,
    },
    kicksTitle: {
        marginLeft: spacing.xxs,
        marginTop: spacing.xs,
    },
    kickOrdinal: {
        color: colors.textSecondary,
    },
    setsRow: {
        gap: spacing.xs,
    },
    setsRowTitle: {
        color: colors.textSecondary,
    },
    setsChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    setChip: {
        alignItems: 'center',
        minWidth: 76,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    setChipLabel: {
        color: colors.textSecondary,
    },
    volleySheetList: {
        gap: spacing.xxs,
    },
    volleySheetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        minHeight: 52,
        paddingHorizontal: spacing.xs,
    },
    volleySheetRowName: {
        flex: 1,
    },
    volleyButtonsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    volleyButtonSlot: {
        flex: 1,
    },
    volleyButton: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xxs,
        paddingVertical: spacing.lg,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        boxShadow: shadows.primaryButton,
    },
    volleyButtonTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
    },
    volleyButtonLabel: {
        color: colors.surface,
    },
    volleyButtonTeam: {
        color: 'rgba(255,255,255,0.85)',
    },
    volleyQuickActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    volleyQuickActionButton: {
        flex: 1,
    },
    finishCard: {
        alignItems: 'center',
        gap: spacing.xs,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    finishCardTeams: {
        flexDirection: 'row',
        width: '100%',
    },
    finishCardTeamName: {
        flex: 1,
    },
    finishCardTeamNameRight: {
        textAlign: 'right',
    },
    finishCardScore: {
        marginTop: spacing.xxs,
    },
    finishWinnerPill: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        borderCurve: 'continuous',
        backgroundColor: colors.primarySoft,
    },
    finishWinnerLabel: {
        color: colors.primaryDark,
    },
});
