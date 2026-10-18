import { useRef, useState, type RefObject } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { DateField } from '@/components/form/date-field';
import { MatchScoreHeader } from '@/components/match/match-score-header';
import { MatchTimeline } from '@/components/match/match-timeline';
import { MonitorPanel } from '@/components/match/monitor-panel';
import { BottomSheet, type BottomSheetHandle } from '@/components/overlays/bottom-sheet';
import { ConfirmDialog } from '@/components/overlays/confirm-dialog';
import { ErrorState, LoadingState } from '@/components/states/screen-states';
import { TeamAvatar } from '@/components/teams/team-avatar';
import { ThemedText } from '@/components/themed-text';
import { useUpdateMatch, useDeleteMatch } from '@/hooks/useBrackets';
import { useMatchDetails } from '@/hooks/useMatches';
import { useMatchLive } from '@/hooks/useRealtime';
import { useTeams } from '@/hooks/useTeams';
import { useToast } from '@/providers/ToastProvider';
import { MatchCategoryLabel, MatchTypeLabel, type MatchCategory, type MatchType } from '@/types/enums';
import type { MatchPublicResponse, MatchUpdateRequest } from '@/types/match';
import type { TeamSummary } from '@/types/team';
import { colors, fontFamily, radius, spacing } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { isoToPickerDateTime, pickerDateTimeToIso } from '@/utils/campus-time';
import { queryKeys } from '@/utils/query-keys';

function matchRoundLabel(match: { match_type: MatchType; match_category: MatchCategory }): string {
    if (match.match_type !== 'REGULAR') return MatchTypeLabel[match.match_type];
    return MatchCategoryLabel[match.match_category];
}

interface SelectedTeam {
    team_id: string;
    name: string;
    photo?: string | null;
}

function TeamPickerSheet({
    sheetRef,
    title,
    teams,
    selectedTeamId,
    onSelect,
}: {
    sheetRef: RefObject<BottomSheetHandle | null>;
    title: string;
    teams: TeamSummary[];
    selectedTeamId?: string;
    onSelect: (team: TeamSummary) => void;
}) {
    return (
        <BottomSheet ref={sheetRef} title={title} snapPoints={['60%']}>
            <View style={styles.teamSheetList}>
                {teams.length === 0 ? (
                    <ThemedText variant="body" style={styles.teamSheetEmpty}>
                        Nenhum time aprovado disponível para esta modalidade.
                    </ThemedText>
                ) : (
                    teams.map((team) => {
                        const selected = team.team_id === selectedTeamId;
                        return (
                            <Pressable
                                key={team.team_id}
                                accessibilityRole="button"
                                accessibilityState={{ selected }}
                                accessibilityLabel={team.name}
                                onPress={() => {
                                    onSelect(team);
                                    sheetRef.current?.dismiss();
                                }}
                                style={({ pressed }) => [
                                    styles.teamSheetRow,
                                    selected && styles.teamSheetRowSelected,
                                    { opacity: pressed ? 0.7 : 1 },
                                ]}
                            >
                                <TeamAvatar name={team.name} photo={team.photo} size={36} />
                                <ThemedText variant="bodyLg" style={styles.teamSheetRowName} numberOfLines={1}>
                                    {team.name}
                                </ThemedText>
                                {selected ? <Icon name="check" size={18} color={colors.primary} /> : null}
                            </Pressable>
                        );
                    })
                )}
            </View>
        </BottomSheet>
    );
}

function TeamField({ label, team, onPress }: { label: string; team: SelectedTeam | null; onPress: () => void }) {
    return (
        <View style={styles.field}>
            <ThemedText variant="label">{label}</ThemedText>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${label}: ${team?.name ?? 'Selecionar time'}. Trocar time`}
                onPress={onPress}
                style={({ pressed }) => [styles.fieldBox, { opacity: pressed ? 0.8 : 1 }]}
            >
                <View style={styles.fieldBoxTeam}>
                    <TeamAvatar name={team?.name ?? '?'} photo={team?.photo} size={32} />
                    <ThemedText
                        variant="bodyLg"
                        numberOfLines={1}
                        style={[styles.fieldBoxTeamName, !team && styles.fieldBoxPlaceholder]}
                    >
                        {team?.name ?? 'Selecionar time'}
                    </ThemedText>
                </View>
                <Icon name="chev_d" size={18} color={colors.textMuted} />
            </Pressable>
        </View>
    );
}

function EditMatchForm({ seasonId, match }: { seasonId: string; match: MatchPublicResponse }) {
    const toast = useToast();
    const queryClient = useQueryClient();
    const updateMatch = useUpdateMatch();
    const deleteMatch = useDeleteMatch();
    const teams = useTeams({ status: 'APPROVED', season_id: seasonId });

    const team1Sheet = useRef<BottomSheetHandle>(null);
    const team2Sheet = useRef<BottomSheetHandle>(null);

    const [team1, setTeam1] = useState<SelectedTeam | null>(
        match.team1 ? { team_id: match.team1.team_id, name: match.team1.name, photo: match.team1.photo } : null
    );
    const [team2, setTeam2] = useState<SelectedTeam | null>(
        match.team2 ? { team_id: match.team2.team_id, name: match.team2.name, photo: match.team2.photo } : null
    );
    const [date, setDate] = useState(() => isoToPickerDateTime(match.scheduled_date));
    const [deleteOpen, setDeleteOpen] = useState(false);

    const eligibleTeams = (teams.data ?? []).filter((team) => team.modality_id === match.modality_id);
    const team1Options = eligibleTeams.filter((team) => team.team_id !== team2?.team_id);
    const team2Options = eligibleTeams.filter((team) => team.team_id !== team1?.team_id);

    const invalidateMatch = () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
    };

    const handleSave = async () => {
        const request: MatchUpdateRequest = {
            team1_id: team1?.team_id ?? null,
            team2_id: team2?.team_id ?? null,
            scheduled_date: pickerDateTimeToIso(date),
        };

        try {
            await updateMatch.mutateAsync({ matchId: match.match_id, request });
            invalidateMatch();
            toast.success('Partida atualizada.');
            router.back();
        } catch (error) {
            toast.error(friendlyErrorMessage(error, 'Não foi possível atualizar a partida.'));
        }
    };

    const handleDelete = async () => {
        try {
            await deleteMatch.mutateAsync(match.match_id);
            invalidateMatch();
            setDeleteOpen(false);
            toast.success('Partida excluída.');
            router.back();
        } catch (error) {
            toast.error(friendlyErrorMessage(error, 'Não foi possível excluir a partida.'));
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Editar partida' }} />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={styles.editContent}
                keyboardShouldPersistTaps="handled"
            >
                <ThemedText variant="body" style={styles.editSubtitle}>
                    {matchRoundLabel(match)} · {match.modality_name ?? 'Modalidade'}
                </ThemedText>

                <TeamField label="Time 1" team={team1} onPress={() => team1Sheet.current?.present()} />
                <TeamField label="Time 2" team={team2} onPress={() => team2Sheet.current?.present()} />

                <View style={styles.dateRow}>
                    <View style={styles.dateRowItem}>
                        <DateField label="Data" value={date} onChange={setDate} minimumDate={new Date()} mode="date" />
                    </View>
                    <View style={styles.dateRowItem}>
                        <DateField label="Hora" value={date} onChange={setDate} mode="time" />
                    </View>
                </View>

                <View style={styles.infoBanner}>
                    <Icon name="info" size={18} color={colors.primaryDark} />
                    <ThemedText variant="body" style={styles.infoBannerText}>
                        Só é possível editar partidas ainda agendadas (SCHEDULED).
                    </ThemedText>
                </View>

                <View style={styles.editActions}>
                    <Button title="Salvar alterações" loading={updateMatch.isPending} onPress={handleSave} />
                    <Button
                        title="Excluir partida"
                        variant="dangerSoft"
                        icon="trash"
                        disabled={updateMatch.isPending}
                        onPress={() => setDeleteOpen(true)}
                    />
                </View>
            </ScrollView>

            <TeamPickerSheet
                sheetRef={team1Sheet}
                title="Escolher Time 1"
                teams={team1Options}
                selectedTeamId={team1?.team_id}
                onSelect={(team) => setTeam1({ team_id: team.team_id, name: team.name, photo: team.photo })}
            />
            <TeamPickerSheet
                sheetRef={team2Sheet}
                title="Escolher Time 2"
                teams={team2Options}
                selectedTeamId={team2?.team_id}
                onSelect={(team) => setTeam2({ team_id: team.team_id, name: team.name, photo: team.photo })}
            />

            <ConfirmDialog
                visible={deleteOpen}
                title="Excluir partida?"
                description="Esta ação não pode ser desfeita."
                confirmLabel="Excluir"
                tone="danger"
                confirming={deleteMatch.isPending}
                onConfirm={handleDelete}
                onCancel={() => setDeleteOpen(false)}
            />
        </>
    );
}

export function ManageMatchScreenContent({
    seasonId,
    matchId,
    view,
}: {
    seasonId: string;
    matchId: string;
    view?: string;
}) {
    const details = useMatchDetails(matchId);
    const live = useMatchLive(matchId);
    const match = details.data;

    const refresh = () => details.refetch();

    if (details.isPending) {
        return <LoadingState label="Carregando partida…" />;
    }

    if (details.isError || !match) {
        return (
            <ErrorState
                title="Não foi possível carregar a partida"
                description={friendlyErrorMessage(details.error, 'Tente de novo.')}
                onRetry={refresh}
                retrying={details.isRefetching}
            />
        );
    }

    if (match.status === 'SCHEDULED' && view === 'edit') {
        return <EditMatchForm seasonId={seasonId} match={match} />;
    }

    const showReconnectHint =
        match.status === 'IN_PROGRESS' && (live.status === 'reconnecting' || live.status === 'error');

    return (
        <>
            <Stack.Screen options={{ title: 'Gerenciar partida' }} />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={details.isRefetching} onRefresh={refresh} />}
            >
                <MatchScoreHeader match={match} dataUpdatedAt={details.dataUpdatedAt} />

                {showReconnectHint ? (
                    <ThemedText variant="caption" style={styles.liveHint}>
                        Reconectando à transmissão ao vivo… o placar pode estar desatualizado.
                    </ThemedText>
                ) : null}

                <MonitorPanel match={match} />

                <MatchTimeline match={match} />
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.md,
    },
    liveHint: {
        textAlign: 'center',
        color: colors.textSecondary,
    },
    editContent: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.lg,
    },
    editSubtitle: {
        color: colors.textSecondary,
        marginTop: -spacing.xs,
    },
    field: {
        gap: spacing.xs,
    },
    fieldBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 56,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    fieldBoxTeam: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    fieldBoxTeamName: {
        flex: 1,
    },
    fieldBoxPlaceholder: {
        color: colors.textSecondary,
    },
    dateRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    dateRowItem: {
        flex: 1,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.primarySoft,
    },
    infoBannerText: {
        flex: 1,
        color: colors.primaryDark,
    },
    editActions: {
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    teamSheetList: {
        gap: spacing.xs,
    },
    teamSheetEmpty: {
        color: colors.textSecondary,
        textAlign: 'center',
        paddingVertical: spacing.lg,
    },
    teamSheetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        minHeight: 56,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.md,
        borderCurve: 'continuous',
    },
    teamSheetRowSelected: {
        backgroundColor: colors.primarySoft,
    },
    teamSheetRowName: {
        flex: 1,
    },
});
