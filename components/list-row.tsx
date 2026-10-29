import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { TeamAvatar } from '@/components/teams/team-avatar';
import { ThemedText } from '@/components/themed-text';
import { colors, fontFamily, radius, spacing } from '@/theme';

const ROW_BACKGROUND = colors.field;
const ROW_RADIUS = radius.md;

interface ListRowProps {
    leading?: ReactNode;
    title: string;
    subtitle?: string;
    trailing?: ReactNode;
    emphasis?: 'bold' | 'regular';
    onPress?: () => void;
    accessibilityLabel?: string;
}

export function ListRow({
    leading,
    title,
    subtitle,
    trailing,
    emphasis = 'bold',
    onPress,
    accessibilityLabel,
}: ListRowProps) {
    const content = (
        <>
            {leading ? <View style={styles.leadingSlot}>{leading}</View> : null}
            <View style={styles.texts}>
                <ThemedText
                    variant="body"
                    numberOfLines={1}
                    style={emphasis === 'bold' ? styles.titleBold : undefined}
                >
                    {title}
                </ThemedText>
                {subtitle ? (
                    <ThemedText variant="caption" numberOfLines={1} style={styles.subtitle}>
                        {subtitle}
                    </ThemedText>
                ) : null}
            </View>
            {trailing ? <View style={styles.trailingSlot}>{trailing}</View> : null}
        </>
    );

    if (!onPress) {
        return <View style={styles.row}>{content}</View>;
    }

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? title}
            onPress={onPress}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
        >
            {content}
        </Pressable>
    );
}

// Bolha de ícone colorida para linhas de evento (gol/cartão/período/pênalti).
// O guia pede ícones de 38pt — o tamanho do <Icon> fica a critério de quem
// chama, aqui só dimensionamos a bolha ao redor dele.
export function ListRowIcon({ background, size = 56, children }: { background: string; size?: number; children: ReactNode }) {
    return (
        <View style={[styles.iconBubble, { width: size, height: size, borderRadius: size / 2, backgroundColor: background }]}>
            {children}
        </View>
    );
}

// --- Linha de resumo de partida ("Lobos 1 × Titãs 0 · AO VIVO 12'") --------

interface MatchListRowTeam {
    name: string;
    score?: number;
}

interface MatchListRowProps {
    team1: MatchListRowTeam;
    team2: MatchListRowTeam;
    trailing: ReactNode;
    onPress?: () => void;
    accessibilityLabel?: string;
}

function TeamLine({ team }: { team: MatchListRowTeam }) {
    return (
        <View style={styles.teamLine}>
            <TeamAvatar name={team.name} size={28} />
            <ThemedText variant="section" numberOfLines={1} style={styles.teamLineName}>
                {team.name}
            </ThemedText>
            {team.score !== undefined ? (
                <ThemedText variant="section" style={styles.teamLineScore}>
                    {team.score}
                </ThemedText>
            ) : null}
        </View>
    );
}

export const MatchListRow = memo(function MatchListRow({
    team1,
    team2,
    trailing,
    onPress,
    accessibilityLabel,
}: MatchListRowProps) {
    const content = (
        <>
            <View style={styles.teams}>
                <TeamLine team={team1} />
                <TeamLine team={team2} />
            </View>
            <View style={styles.divider} />
            <View style={styles.trailingSlot}>{trailing}</View>
        </>
    );

    if (!onPress) {
        return <View style={styles.row}>{content}</View>;
    }

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? `${team1.name} contra ${team2.name}`}
            onPress={onPress}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
        >
            {content}
        </Pressable>
    );
});

// Presets prontos para a coluna da direita do MatchListRow. Quem usa só
// formata o texto (minuto, horário, modalidade) — nenhuma lógica de partida
// mora aqui.

export function LiveTrailing({ minute }: { minute: string }) {
    return (
        <View style={styles.liveTrailing}>
            <View style={styles.liveTrailingTop}>
                <View style={styles.liveDot} />
                <ThemedText variant="overline" style={styles.liveLabel}>
                    AO VIVO
                </ThemedText>
            </View>
            <ThemedText variant="section" style={styles.liveMinute}>
                {minute}
            </ThemedText>
        </View>
    );
}

export function ScheduledTrailing({ time, modality }: { time: string; modality?: string }) {
    return (
        <View style={styles.scheduledTrailing}>
            <ThemedText variant="section">{time}</ThemedText>
            {modality ? (
                <ThemedText variant="caption" style={styles.muted}>
                    {modality}
                </ThemedText>
            ) : null}
        </View>
    );
}

export function FinishedTrailing() {
    return (
        <ThemedText variant="body" style={styles.muted}>
            Finalizada
        </ThemedText>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        minHeight: 56,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: ROW_RADIUS,
        borderCurve: 'continuous',
        backgroundColor: ROW_BACKGROUND,
    },
    leadingSlot: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    texts: {
        flex: 1,
        gap: 2,
    },
    titleBold: {
        fontFamily: fontFamily.bold,
    },
    subtitle: {
        color: colors.textSecondary,
    },
    trailingSlot: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    iconBubble: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    teams: {
        flex: 1,
        gap: spacing.xs,
    },
    teamLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    teamLineName: {
        flex: 1,
    },
    teamLineScore: {
        minWidth: 20,
        textAlign: 'right',
    },
    divider: {
        width: 1,
        alignSelf: 'stretch',
        marginVertical: spacing.xs,
        backgroundColor: colors.border,
    },
    liveTrailing: {
        alignItems: 'flex-end',
        gap: 2,
    },
    liveTrailingTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.danger,
    },
    liveLabel: {
        color: colors.danger,
    },
    liveMinute: {
        color: colors.danger,
    },
    scheduledTrailing: {
        alignItems: 'flex-end',
        gap: 2,
    },
    muted: {
        color: colors.textSecondary,
    },
});
