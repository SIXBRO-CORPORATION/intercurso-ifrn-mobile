import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { colors, spacing } from '@/theme';

const BUTTON_SIZE = 36;

type StepperProps = {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    accessibilityLabel?: string;
};

export function Stepper({
    value,
    onChange,
    min = 0,
    max = Infinity,
    step = 1,
    disabled = false,
    accessibilityLabel = 'Contador',
}: StepperProps) {
    const canDecrease = !disabled && value - step >= min;
    const canIncrease = !disabled && value + step <= max;

    return (
        <View style={styles.row}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Diminuir ${accessibilityLabel}`}
                disabled={!canDecrease}
                onPress={() => onChange(Math.max(min, value - step))}
                style={[styles.minusButton, !canDecrease && styles.minusButtonDisabled]}
            >
                <Icon name="minus" size={18} color={canDecrease ? colors.ink : colors.textMuted} />
            </Pressable>

            <ThemedText variant="heading" style={styles.value} accessibilityLabel={`${accessibilityLabel}: ${value}`}>
                {value}
            </ThemedText>

            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Aumentar ${accessibilityLabel}`}
                disabled={!canIncrease}
                onPress={() => onChange(Math.min(max, value + step))}
                style={[styles.plusButton, !canIncrease && styles.plusButtonDisabled]}
            >
                <Icon name="plus" size={18} color={canIncrease ? colors.surface : colors.textMuted} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    minusButton: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    minusButtonDisabled: {
        backgroundColor: colors.field,
        borderColor: colors.field,
    },
    plusButton: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        borderCurve: 'continuous',
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    plusButtonDisabled: {
        backgroundColor: colors.field,
    },
    value: {
        minWidth: 28,
        textAlign: 'center',
    },
});
