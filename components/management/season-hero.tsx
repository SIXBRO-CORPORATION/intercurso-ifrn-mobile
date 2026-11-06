import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { useSeasonDetails } from '@/hooks/useSeasons';
import { SeasonStatusLabel } from '@/types/enums';
import type { SeasonSummary } from '@/types/season';
import { colors, radius, shadows, spacing } from '@/theme';

const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END = { x: 1, y: 1 } as const;

function HeroStat({ value, label }: { value: number | undefined; label: string }) {
    return (
        <View style={styles.stat}>
            <ThemedText variant="largeTitle" style={styles.statValue}>
                {value ?? '—'}
            </ThemedText>
            <ThemedText variant="label" style={styles.statLabel}>
                {label}
            </ThemedText>
        </View>
    );
}

export function CurrentSeasonHero({ season }: { season: SeasonSummary }) {
    const details = useSeasonDetails(season.season_id);
    const stats = details.data;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Temporada atual, ${season.name}, ${SeasonStatusLabel[season.status]}. Abrir`}
            onPress={() => router.push(`/seasons/${season.season_id}`)}
            style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}
        >
            <LinearGradient colors={colors.gradientPrimary} start={GRADIENT_START} end={GRADIENT_END} style={styles.card}>
                <View style={styles.top}>
                    <ThemedText variant="overline" style={styles.overline}>
                        Temporada atual
                    </ThemedText>
                    <View style={styles.pill}>
                        <View style={styles.pillDot} />
                        <ThemedText variant="label" style={styles.pillLabel}>
                            {SeasonStatusLabel[season.status]}
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.titleRow}>
                    <ThemedText variant="title" style={styles.title} numberOfLines={1}>
                        {season.name}
                    </ThemedText>
                    <Icon name="chev_r" size={24} color={colors.surface} />
                </View>

                <View style={styles.stats}>
                    <HeroStat value={stats?.total_teams_created} label="Criados" />
                    <View style={styles.divider} />
                    <HeroStat value={stats?.total_teams_submitted} label="Submetidos" />
                    <View style={styles.divider} />
                    <HeroStat value={stats?.total_teams_approved} label="Aprovados" />
                </View>
            </LinearGradient>
        </Pressable>
    );
}

export function NoSeasonHero() {
    return (
        <LinearGradient colors={colors.gradientPrimary} start={GRADIENT_START} end={GRADIENT_END} style={styles.card}>
            <View style={styles.emptyHeader}>
                <View style={styles.emptyBubble}>
                    <Icon name="calendar" size={22} color={colors.surface} />
                </View>
                <View style={styles.emptyTexts}>
                    <ThemedText variant="section" style={styles.title}>
                        Próxima temporada
                    </ThemedText>
                    <ThemedText variant="bodySm" style={styles.emptySubtitle}>
                        Nenhuma temporada ativa
                    </ThemedText>
                </View>
            </View>
            <ThemedText variant="body" style={styles.emptyDescription}>
                A anterior foi finalizada. Crie a próxima quando for iniciar um novo campeonato.
            </ThemedText>
            <Button title="Criar temporada" variant="light" icon="plus" onPress={() => router.push('/seasons/create')} />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: radius.hero,
        borderCurve: 'continuous',
        padding: spacing.lg,
        gap: spacing.md,
        boxShadow: shadows.card,
    },
    top: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    overline: {
        color: colors.primarySoft,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        backgroundColor: 'rgba(255,255,255,0.22)',
    },
    pillDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.surface,
    },
    pillLabel: {
        color: colors.surface,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    title: {
        flex: 1,
        color: colors.surface,
    },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stat: {
        flex: 1,
        gap: 2,
    },
    statValue: {
        color: colors.surface,
    },
    statLabel: {
        color: colors.primarySoft,
    },
    divider: {
        width: 1,
        alignSelf: 'stretch',
        marginHorizontal: spacing.md,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    emptyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    emptyBubble: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.22)',
    },
    emptyTexts: {
        flex: 1,
    },
    emptySubtitle: {
        color: colors.primarySoft,
    },
    emptyDescription: {
        color: colors.surface,
    },
});
