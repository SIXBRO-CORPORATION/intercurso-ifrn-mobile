import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/icon';
import { colors, radius } from '@/theme';

type CheckboxProps = {
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
    accessibilityLabel?: string;
};

export function Checkbox({ value, onValueChange, disabled = false, accessibilityLabel }: CheckboxProps) {
    return (
        <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ checked: value, disabled }}
            disabled={disabled}
            onPress={() => onValueChange(!value)}
            hitSlop={8}
            style={disabled ? styles.disabled : undefined}
        >
            <View style={[styles.box, value && styles.boxChecked]}>
                {value ? <Icon name="check" size={16} color={colors.surface} /> : null}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    box: {
        width: 24,
        height: 24,
        borderRadius: radius.xs,
        borderCurve: 'continuous',
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    boxChecked: {
        borderColor: colors.primary,
        backgroundColor: colors.primary,
    },
    disabled: {
        opacity: 0.5,
    },
});
