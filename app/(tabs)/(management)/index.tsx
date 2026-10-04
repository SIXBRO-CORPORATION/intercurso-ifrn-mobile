import { ScrollView, StyleSheet, View } from 'react-native';
import { ManagementRow } from '@/components/management/management-row';
import { EmptyState, LoadingState } from '@/components/states/screen-states';
import { useAllModalities } from '@/hooks/useModalities';
import { useAuth } from '@/hooks/useAuth';
import { useSeasons } from '@/hooks/useSeasons';
import { colors, radius, spacing } from '@/theme';

interface CountableQuery {
    isPending: boolean;
    isError: boolean;
    data?: unknown[];
}

function countLabel(query: CountableQuery, singular: string, plural: string): string {
    if (query.isPending) return 'Carregando…';
    if (query.isError) return 'Não foi possível carregar';

    const total = query.data?.length ?? 0;
    return `${total} ${total === 1 ? singular : plural}`;
}

function ManagementHub() {
    const seasons = useSeasons();
    const modalities = useAllModalities();

    return (
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
            <View style={styles.group}>
                <ManagementRow
                    title="Temporadas"
                    subtitle={countLabel(seasons, 'temporada', 'temporadas')}
                    href="/seasons"
                />
                <View style={styles.separator} />
                <ManagementRow
                    title="Modalidades"
                    subtitle={countLabel(modalities, 'modalidade', 'modalidades')}
                    href="/modalities"
                />
            </View>
        </ScrollView>
    );
}

export default function ManagementScreen() {
    const { user, isInitializing } = useAuth();

    if (isInitializing) {
        return <LoadingState label="Carregando…" />;
    }

    const canManage = user?.role === 'MONITOR' || user?.role === 'ADMIN';

    if (!canManage) {
        return (
            <EmptyState
                title="Acesso restrito"
                description="Esta área é exclusiva para monitores e administradores."
            />
        );
    }

    return <ManagementHub />;
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
    },
    group: {
        backgroundColor: colors.secondarySystemBackground as string,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        overflow: 'hidden',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        marginLeft: spacing.md,
        backgroundColor: colors.separator as string,
    },
});
