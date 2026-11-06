import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/icon';
import { ListRowIcon } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { colors, fontFamily, radius, spacing } from '@/theme';

type PreviousSeasonsLinkProps = {
    count?: number;
};

export function PreviousSeasonsLink({ count }: PreviousSeasonsLinkProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Temporadas anteriores${count !== undefined ? `, ${count}` : ''}. Consulte campeões, jogos e chaves`}
            onPress={() => router.push('/seasons/history')}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
        >
            <ListRowIcon background={colors.surface} size={44}>
                <Icon name="history" size={20} color={colors.primary} />
            </ListRowIcon>
            <View style={styles.texts}>
                <ThemedText variant="section" numberOfLines={1}>
                    Temporadas anteriores
                </ThemedText>
                <ThemedText variant="caption" numberOfLines={1}>
                    Consulte campeões, jogos e chaves
                </ThemedText>
            </View>
            {count !== undefined ? (
                <ThemedText variant="label" style={styles.count}>
                    {count}
                </ThemedText>
            ) : null}
            <Icon name="chev_r" size={20} color={colors.textMuted} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    texts: {
        flex: 1,
        gap: 2,
    },
    count: {
        fontFamily: fontFamily.bold,
        color: colors.textSecondary,
    },
});
