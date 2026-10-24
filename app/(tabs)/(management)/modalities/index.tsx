import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/icon';
import { ListRowIcon } from '@/components/list-row';
import { Toggle } from '@/components/form/toggle';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useModalitiesAdmin, useUpdateModalityActive } from '@/hooks/useModalities';
import { useToast } from '@/providers/ToastProvider';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { ModalityGenderModeLabel, ScoreTypeLabel, type ModalityGenderMode } from '@/types/enums';
import type { ModalitySummaryResponse } from '@/types/modality-list';
import { colors, fontFamily, radius, spacing } from '@/theme';
import { formatGenderRule, formatMembers } from '@/utils/modality-gender';

const GENDER_PILL_TONE: Record<ModalityGenderMode, { background: string; foreground: string }> = {
    MALE: { background: colors.primarySoft, foreground: colors.primaryDark },
    FEMALE: { background: colors.primarySoft, foreground: colors.primaryDark },
    MIXED: { background: colors.warningSoft, foreground: colors.warningText },
};

function GenderPill({ mode, muted }: { mode: ModalityGenderMode; muted: boolean }) {
    const tone = GENDER_PILL_TONE[mode];
    const background = muted ? colors.field : tone.background;
    const foreground = muted ? colors.textMuted : tone.foreground;

    return (
        <View style={[styles.genderPill, { backgroundColor: background }]}>
            <ThemedText variant="caption" style={[styles.genderPillLabel, { color: foreground }]}>
                {ModalityGenderModeLabel[mode]}
            </ThemedText>
        </View>
    );
}

function configLabel(modality: ModalitySummaryResponse): string {
    const scoreLabel = ScoreTypeLabel[modality.score_type];

    if (modality.score_type === 'SETS') {
        if (modality.sets_to_win == null) return scoreLabel;
        const sets = modality.sets_to_win === 1 ? '1 set' : `${modality.sets_to_win} sets`;
        return `${sets} · ${scoreLabel}`;
    }

    const periods = modality.num_periods === 1 ? '1 período' : `${modality.num_periods} períodos`;
    return `${periods} · ${modality.period_durations_minutes} min · ${scoreLabel}`;
}

function ModalityRow({ modality }: { modality: ModalitySummaryResponse }) {
    const toast = useToast();
    const updateActive = useUpdateModalityActive();
    const members = formatMembers(modality);
    const gender = formatGenderRule(modality);
    const muted = !modality.active;

    const handleToggle = (next: boolean) => {
        updateActive.mutate(
            { modalityId: modality.modality_id, active: next },
            {
                onError: (error) => {
                    toast.error(friendlyErrorMessage(error, 'Não foi possível atualizar a modalidade.'));
                },
            }
        );
    };

    return (
        <View
            style={styles.card}
            accessible
            accessibilityLabel={`${modality.name}, ${gender}, ${members}, ${modality.active ? 'ativa' : 'inativa'}`}
        >
            <ListRowIcon background={muted ? colors.field : colors.primarySoft} size={48}>
                <Icon name="ball" size={22} color={muted ? colors.textMuted : colors.primary} />
            </ListRowIcon>
            <View style={styles.texts}>
                <ThemedText variant="section" numberOfLines={1} style={muted ? styles.mutedText : undefined}>
                    {modality.name}
                </ThemedText>
                <View style={styles.meta}>
                    <GenderPill mode={modality.gender_mode} muted={muted} />
                    {members ? (
                        <ThemedText variant="caption" style={styles.membersText} numberOfLines={1}>
                            {members}
                        </ThemedText>
                    ) : null}
                </View>
                <ThemedText variant="caption" style={styles.configText} numberOfLines={1}>
                    {configLabel(modality)}
                </ThemedText>
            </View>
            <Toggle
                value={modality.active}
                onValueChange={handleToggle}
                disabled={updateActive.isPending}
                accessibilityLabel={`${modality.active ? 'Desativar' : 'Ativar'} ${modality.name}`}
            />
        </View>
    );
}

export default function ModalitiesScreen() {
    const modalities = useModalitiesAdmin();
    const items = modalities.data ?? [];

    const renderEmpty = () => {
        if (modalities.isPending) {
            return <LoadingState label="Carregando modalidades…" />;
        }

        if (modalities.isError) {
            return (
                <ErrorState
                    title="Não foi possível carregar as modalidades"
                    description={friendlyErrorMessage(modalities.error, 'Tente de novo.')}
                    onRetry={() => modalities.refetch()}
                    retrying={modalities.isRefetching}
                />
            );
        }

        return (
            <EmptyState
                title="Nenhuma modalidade cadastrada"
                description="Cadastre uma modalidade para poder criar temporadas."
                actionLabel="Criar modalidade"
                onAction={() => router.push('/modalities/create')}
            />
        );
    };

    return (
        <FlatList
            data={items}
            keyExtractor={(item) => item.modality_id}
            renderItem={({ item }) => <ModalityRow modality={item} />}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[styles.content, items.length === 0 && styles.fill]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={renderEmpty}
            refreshControl={<RefreshControl refreshing={modalities.isRefetching} onRefresh={() => modalities.refetch()} />}
        />
    );
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xl,
    },
    fill: {
        flexGrow: 1,
    },
    separator: {
        height: spacing.sm,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    texts: {
        flex: 1,
        gap: spacing.xxs,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    genderPill: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.pill,
        borderCurve: 'continuous',
    },
    genderPillLabel: {
        fontFamily: fontFamily.bold,
    },
    membersText: {
        color: colors.textSecondary,
    },
    configText: {
        color: colors.textMuted,
        marginTop: 2,
    },
    mutedText: {
        color: colors.textMuted,
    },
});
