import { ScrollView, StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ManagementGuard } from '@/components/management/management-guard';
import { PreviousSeasonsLink } from '@/components/management/previous-seasons-link';
import { ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useSeasonOverview } from '@/hooks/useSeasons';
import type { SeasonSummary } from '@/types/season';
import { colors, radius, spacing } from '@/theme';
import { formatCampusDate } from '@/utils/campus-time';

function lastSeasonLabel(season: SeasonSummary): string {
    return season.finished_at ? `${season.name} · ${formatCampusDate(season.finished_at)}` : season.name;
}

function NoActiveSeason({ lastFinished, finishedCount }: { lastFinished?: SeasonSummary; finishedCount: number }) {
    return (
        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.hero}>
                <View style={styles.ring}>
                    <View style={styles.ringInner}>
                        <Icon name="calendar" size={40} color={colors.primary} />
                    </View>
                </View>
                <ThemedText variant="title" style={styles.centered}>
                    Nenhuma temporada ativa
                </ThemedText>
                <ThemedText variant="bodyLg" style={[styles.centered, styles.description]}>
                    A temporada anterior foi finalizada. Crie a próxima quando for iniciar um novo campeonato.
                </ThemedText>
            </View>

            {lastFinished ? (
                <View style={styles.lastSeason}>
                    <View style={styles.lastSeasonIcon}>
                        <Icon name="archive" size={20} color={colors.textSecondary} />
                    </View>
                    <View style={styles.lastSeasonTexts}>
                        <ThemedText variant="caption">Última temporada</ThemedText>
                        <ThemedText variant="section" numberOfLines={1}>
                            {lastSeasonLabel(lastFinished)}
                        </ThemedText>
                    </View>
                </View>
            ) : null}

            <View style={styles.cta}>
                <Button title="Criar temporada" icon="plus" onPress={() => router.push('/seasons/create')} />
                <ThemedText variant="caption" style={[styles.centered, styles.ctaHint]}>
                    Só uma temporada pode existir por vez.
                </ThemedText>
            </View>

            <PreviousSeasonsLink count={finishedCount} />
        </ScrollView>
    );
}

function SeasonsEntry() {
    const overview = useSeasonOverview();

    if (overview.isPending) {
        return <LoadingState label="Carregando temporada…" />;
    }

    if (overview.isError) {
        return (
            <ErrorState
                title="Não foi possível carregar a temporada"
                description="Verifique sua conexão e tente de novo."
                onRetry={() => overview.refetch()}
                retrying={overview.isRefetching}
            />
        );
    }

    // F07: com temporada em andamento, "Temporada" abre direto a atual (sem botão de criar).
    if (overview.current) {
        return <Redirect href={`/seasons/${overview.current.season_id}`} />;
    }

    return <NoActiveSeason lastFinished={overview.lastFinished} finishedCount={overview.finished.length} />;
}

export default function SeasonsEntryScreen() {
    return (
        <ManagementGuard>
            <SeasonsEntry />
        </ManagementGuard>
    );
}

const styles = StyleSheet.create({
    content: {
        flexGrow: 1,
        padding: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.lg,
    },
    hero: {
        alignItems: 'center',
        gap: spacing.md,
        paddingTop: spacing.xl,
    },
    ring: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primarySoft,
    },
    ringInner: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
    },
    centered: {
        textAlign: 'center',
    },
    description: {
        color: colors.textSecondary,
        paddingHorizontal: spacing.md,
    },
    lastSeason: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    lastSeasonIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
    },
    lastSeasonTexts: {
        flex: 1,
        gap: 2,
    },
    cta: {
        gap: spacing.sm,
    },
    ctaHint: {
        color: colors.textMuted,
    },
});
