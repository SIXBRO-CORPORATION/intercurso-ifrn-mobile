import { useEffect, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { colors, motion, radius, shadows, spacing } from '@/theme';

type ConfirmDialogProps = {
    visible: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'primary' | 'danger';
    confirming?: boolean;
    confirmDisabled?: boolean;
    children?: ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
};

export function ConfirmDialog({
    visible,
    title,
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    tone = 'primary',
    confirming = false,
    confirmDisabled = false,
    children,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const scale = useSharedValue(0.92);
    const scrimOpacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            scale.value = withSpring(1, motion.spring);
            scrimOpacity.value = withTiming(1, { duration: motion.fast, easing: motion.easing });
        } else {
            scale.value = 0.92;
            scrimOpacity.value = 0;
        }
    }, [visible, scale, scrimOpacity]);

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const scrimStyle = useAnimatedStyle(() => ({
        opacity: scrimOpacity.value,
    }));

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
            <Animated.View style={[styles.scrim, scrimStyle]}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={confirming ? undefined : onCancel}
                    accessibilityLabel="Fechar"
                    accessibilityRole="button"
                />
                <Animated.View style={[styles.card, cardStyle]} accessibilityRole="alert">
                    <ThemedText variant="heading" style={styles.title}>
                        {title}
                    </ThemedText>
                    {description ? (
                        <ThemedText variant="body" style={styles.description}>
                            {description}
                        </ThemedText>
                    ) : null}
                    {children}
                    <View style={styles.actions}>
                        <Button
                            title={confirmLabel}
                            variant={tone === 'danger' ? 'danger' : 'primary'}
                            onPress={onConfirm}
                            loading={confirming}
                            disabled={confirmDisabled}
                        />
                        <Button title={cancelLabel} variant="neutral" onPress={onCancel} disabled={confirming} />
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    scrim: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        backgroundColor: 'rgba(15, 26, 19, 0.5)',
    },
    card: {
        width: '100%',
        maxWidth: 360,
        borderRadius: radius.xl,
        borderCurve: 'continuous',
        backgroundColor: colors.surface,
        padding: spacing.xl,
        gap: spacing.md,
        boxShadow: shadows.sheet,
    },
    title: {
        textAlign: 'center',
    },
    description: {
        textAlign: 'center',
        color: colors.textSecondary,
    },
    actions: {
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
});
