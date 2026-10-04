import { ScrollView, StyleSheet } from 'react-native';
import { ManagementCard } from '@/components/management/management-card';
import { EmptyState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useAllModalities } from '@/hooks/useModalities';
import { useAuth } from '@/hooks/useAuth';
import { useSeasons } from '@/hooks/useSeasons';
import { colors, spacing } from '@/theme';

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
            <ThemedText variant="caption" style={styles.section}>
                MÓDULOS
            </ThemedText>
            <ManagementCard
                title="Temporadas"
                subtitle={countLabel(seasons, 'temporada', 'temporadas')}
                href="/seasons"
            />
            <ManagementCard
                title="Modalidades"
                subtitle={countLabel(modalities, 'modalidade', 'modalidades')}
                href="/modalities"
            />
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
        gap: spacing.md,
    },
    section: {
        marginLeft: spacing.sm,
        marginBottom: -spacing.xs,
        color: colors.secondaryLabel as string,
        textAlign: 'left',
    },
});
