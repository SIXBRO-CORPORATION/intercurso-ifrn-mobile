import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { colors, motion, shadows, spacing } from '@/theme';

type Variant = 'primary' | 'outline' | 'soft' | 'neutral' | 'danger' | 'dangerSoft' | 'warning' | 'dark';
type Size = 'default' | 'compact' | 'small';

const heights: Record<Size, number> = {
    default: 56,
    compact: 48,
    small: 40,
};

const horizontalPadding: Record<Size, number> = {
    default: spacing.xl,
    compact: spacing.lg,
    small: spacing.md,
};

interface VariantStyle {
    background: string;
    foreground: string;
    borderColor?: string;
    borderWidth?: number;
}

const variants: Record<Variant, VariantStyle> = {
    primary: { background: colors.primary, foreground: colors.surface },
    outline: { background: colors.surface, foreground: colors.primary, borderColor: colors.primary, borderWidth: 1.5 },
    soft: { background: colors.primarySoft, foreground: colors.primaryDark },
    neutral: { background: colors.field, foreground: colors.ink },
    danger: { background: colors.danger, foreground: colors.surface },
    dangerSoft: { background: colors.dangerSoft, foreground: colors.danger },
    warning: { background: colors.warningSoft, foreground: colors.warningText },
    dark: { background: colors.ink, foreground: colors.surface },
};

const disabledStyle: VariantStyle = { background: colors.field, foreground: colors.textMuted };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonProps = {
    title: string;
    variant?: Variant;
    size?: Size;
    icon?: IconName;
    loading?: boolean;
    disabled?: boolean;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
};

export function Button({
    title,
    variant = 'primary',
    size = 'default',
    icon,
    loading = false,
    disabled = false,
    onPress,
    style,
}: ButtonProps) {
    const isDisabled = disabled || loading;
    const { background, foreground, borderColor, borderWidth } = isDisabled ? disabledStyle : variants[variant];
    const height = heights[size];

    const pressProgress = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 - pressProgress.value * 0.03 }],
        opacity: 1 - pressProgress.value * 0.08,
    }));

    const handlePressIn = () => {
        pressProgress.value = withTiming(1, { duration: motion.fast, easing: motion.easing });
    };

    const handlePressOut = () => {
        pressProgress.value = withTiming(0, { duration: motion.fast, easing: motion.easing });
    };

    return (
        <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            disabled={isDisabled}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
                styles.base,
                {
                    height,
                    borderRadius: height / 2,
                    paddingHorizontal: horizontalPadding[size],
                    backgroundColor: background,
                    borderColor,
                    borderWidth,
                },
                variant === 'primary' && !isDisabled ? styles.primaryShadow : null,
                animatedStyle,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={foreground} />
            ) : (
                <>
                    {icon ? <Icon name={icon} size={20} color={foreground} /> : null}
                    <ThemedText variant="button" style={{ color: foreground }}>
                        {title}
                    </ThemedText>
                </>
            )}
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        borderCurve: 'continuous',
    },
    primaryShadow: {
        boxShadow: shadows.primaryButton,
    },
});
