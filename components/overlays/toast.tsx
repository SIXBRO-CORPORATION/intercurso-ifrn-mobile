import { StyleSheet, View } from 'react-native';
import type { ToastConfig, ToastConfigParams } from 'react-native-toast-message';
import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { colors, radius, shadows, spacing } from '@/theme';

type ToastKind = 'success' | 'error' | 'info';

const kindStyle: Record<ToastKind, { background: string; icon: IconName }> = {
    success: { background: colors.primary, icon: 'check' },
    error: { background: colors.danger, icon: 'warn' },
    info: { background: colors.primary, icon: 'info' },
};

function ToastCard({ kind, text1, text2 }: { kind: ToastKind; text1?: string; text2?: string }) {
    const { background, icon } = kindStyle[kind];

    return (
        <View style={styles.card} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <View style={[styles.iconBubble, { backgroundColor: background }]}>
                <Icon name={icon} size={20} color={colors.surface} />
            </View>
            <View style={styles.texts}>
                {text1 ? (
                    <ThemedText variant="caption" numberOfLines={1} style={styles.label}>
                        {text1}
                    </ThemedText>
                ) : null}
                {text2 ? (
                    <ThemedText variant="section" numberOfLines={2}>
                        {text2}
                    </ThemedText>
                ) : null}
            </View>
        </View>
    );
}

function buildRenderer(kind: ToastKind) {
    return ({ text1, text2 }: ToastConfigParams<unknown>) => <ToastCard kind={kind} text1={text1} text2={text2} />;
}

export const toastConfig: ToastConfig = {
    success: buildRenderer('success'),
    error: buildRenderer('error'),
    info: buildRenderer('info'),
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginHorizontal: spacing.lg,
        padding: spacing.sm,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.surface,
        boxShadow: shadows.sheet,
    },
    iconBubble: {
        width: 44,
        height: 44,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    texts: {
        flex: 1,
        gap: 2,
    },
    label: {
        color: colors.textSecondary,
    },
});
