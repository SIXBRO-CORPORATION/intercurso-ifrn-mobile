import { ActivityIndicator, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { colors, onTint, radius, spacing, useBrandColors } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

const sizes: Record<Size, ViewStyle> = {
    sm: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, minHeight: 36 },
    md: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 44 },
    lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 52 },
};

interface ButtonProps {
    title: string;
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    disabled?: boolean;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
}

export function Button({
    title,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    onPress,
    style,
}: ButtonProps) {
    const brand = useBrandColors();

    const background: Record<Variant, string> = {
        primary: brand.primary,
        secondary: colors.secondarySystemBackground as string,
        ghost: 'transparent',
        destructive: brand.accent,
    };

    const foreground: Record<Variant, string> = {
        primary: onTint,
        secondary: brand.primary,
        ghost: brand.primary,
        destructive: brand.onAccent,
    };

    const isDisabled = disabled || loading;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            disabled={isDisabled}
            onPress={onPress}
            style={({ pressed }) => [
                {
                    backgroundColor: background[variant],
                    borderRadius: radius.md,
                    borderCurve: 'continuous',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
                    ...sizes[size],
                },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={foreground[variant]} />
            ) : (
                <ThemedText variant="headline" style={{ color: foreground[variant] }}>
                    {title}
                </ThemedText>
            )}
        </Pressable>
    );
}
