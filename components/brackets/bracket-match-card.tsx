import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { colors, fontFamily, radius, spacing } from '@/theme';

export const BRACKET_CARD_WIDTH = 220;
export const BRACKET_CARD_HEIGHT = 76;

export interface BracketCardTeam {
    name: string | null;
    score?: number;
}

type BracketMatchCardProps = {
    team1: BracketCardTeam;
    team2: BracketCardTeam;
    live?: boolean;
    liveLabel?: string;
    onPress?: () => void;
    accessibilityLabel?: string;
};

function TeamRow({
    team,
    winner,
    showScore,
}: {
    team: BracketCardTeam;
    winner: boolean;
    showScore: boolean;
}) {
    const label = team.name ?? 'A definir';
    const muted = !team.name;

    return (
        <View style={styles.teamRow}>
            {winner ? <View style={styles.winnerBar} /> : null}
            <ThemedText
                variant="body"
                numberOfLines={1}
                style={[
                    styles.teamName,
                    muted && styles.teamNameMuted,
                    winner && styles.teamNameWinner,
                ]}
            >
                {label}
            </ThemedText>
            {showScore && team.score !== undefined ? (
                <ThemedText variant="section" style={winner ? styles.teamNameWinner : undefined}>
                    {team.score}
                </ThemedText>
            ) : null}
        </View>
    );
}

export function BracketMatchCard({ team1, team2, live = false, liveLabel = 'AO VIVO', onPress, accessibilityLabel }: BracketMatchCardProps) {
    const showScore = team1.score !== undefined || team2.score !== undefined;
    const team1Winner = showScore && !live && team1.score !== undefined && team2.score !== undefined && team1.score > team2.score;
    const team2Winner = showScore && !live && team1.score !== undefined && team2.score !== undefined && team2.score > team1.score;
    const isPressable = Boolean(onPress && (team1.name || team2.name));

    const content = (
        <View style={[styles.card, live && styles.cardLive]}>
            {live ? (
                <View style={styles.livePill}>
                    <View style={styles.liveDot} />
                    <ThemedText variant="overline" style={styles.livePillText}>
                        {liveLabel}
                    </ThemedText>
                </View>
            ) : null}
            <TeamRow team={team1} winner={team1Winner} showScore={showScore} />
            <View style={styles.divider} />
            <TeamRow team={team2} winner={team2Winner} showScore={showScore} />
        </View>
    );

    if (!isPressable) {
        return content;
    }

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? `${team1.name ?? 'A definir'} contra ${team2.name ?? 'A definir'}`}
            onPress={onPress}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
            {content}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        width: BRACKET_CARD_WIDTH,
        minHeight: BRACKET_CARD_HEIGHT,
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    cardLive: {
        borderColor: colors.danger,
        borderWidth: 2,
    },
    livePill: {
        position: 'absolute',
        top: -12,
        left: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        backgroundColor: colors.danger,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.surface,
    },
    livePillText: {
        color: colors.surface,
    },
    teamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 28,
        gap: spacing.xs,
    },
    winnerBar: {
        width: 3,
        alignSelf: 'stretch',
        borderRadius: radius.pill,
        backgroundColor: colors.primary,
    },
    teamName: {
        flex: 1,
        color: colors.ink,
    },
    teamNameMuted: {
        color: colors.textMuted,
    },
    teamNameWinner: {
        fontFamily: fontFamily.bold,
        color: colors.ink,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.xxs,
    },
});
