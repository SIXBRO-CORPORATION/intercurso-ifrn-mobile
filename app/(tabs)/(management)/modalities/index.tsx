import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useAllModalities } from '@/hooks/useModalities';
import { ApiError } from '@/types/api';
import type { ModalitySummaryResponse } from '@/types/modality-list';
import { colors, radius, spacing } from '@/theme';

function ModalityRow({ modality }: { modality: ModalitySummaryResponse }) {
    const members =
        modality.min_members === modality.max_members
            ? `${modality.min_members} por equipe`
            : `${modality.min_members} a ${modality.max_members} por equipe`;

    return (
        <View style={styles.row} accessible accessibilityLabel={`${modality.name}, ${members}`}>
            <View style={styles.texts}>
                <ThemedText variant="headline" numberOfLines={1}>
                    {modality.name}
                </ThemedText>
                <ThemedText variant="subhead">{members}</ThemedText>
            </View>
        </View>
    );
}

export default function ModalitiesScreen() {
    const modalities = useAllModalities();
    const items = modalities.data ?? [];

    const renderEmpty = () => {
        if (modalities.isPending) {
            return <LoadingState label="Carregando modalidades…" />;
        }

        if (modalities.isError) {
            return (
                <ErrorState
                    title="Não foi possível carregar as modalidades"
                    description={modalities.error instanceof ApiError ? modalities.error.message : 'Tente de novo.'}
                    onRetry={() => modalities.refetch()}
                    retrying={modalities.isRefetching}
                />
            );
        }

        return (
            <EmptyState
                title="Nenhuma modalidade ativa"
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
        paddingTop: spacing.sm,
        paddingBottom: spacing.xl,
    },
    fill: {
        flexGrow: 1,
    },
    separator: {
        height: spacing.sm,
    },
    row: {
        marginHorizontal: spacing.md,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.secondarySystemBackground as string,
    },
    texts: {
        gap: 2,
    },
});
