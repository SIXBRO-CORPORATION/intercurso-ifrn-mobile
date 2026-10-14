import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { colors, spacing } from '@/theme';

const BUTTON_SIZE = 36;

interface StepperProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    accessibilityLabel?: string;
}

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
                style={[styles.button, !canDecrease && styles.buttonDisabled]}
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
                style={[styles.button, !canIncrease && styles.buttonDisabled]}
            >
                <Icon name="plus" size={18} color={canIncrease ? colors.ink : colors.textMuted} />
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
    button: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    value: {
        minWidth: 28,
        textAlign: 'center',
    },
});
