import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { colors, fontFamily, radius, spacing } from '@/theme';

type SelectFieldProps<T extends string | number> = {
    label: string;
    value: T;
    options: readonly T[];
    onChange: (value: T) => void;
    formatOption?: (value: T) => string;
};

export function SelectField<T extends string | number>({
    label,
    value,
    options,
    onChange,
    formatOption = String,
}: SelectFieldProps<T>) {
    const [open, setOpen] = useState(false);

    return (
        <View style={styles.wrap}>
            <ThemedText variant="caption">{label}</ThemedText>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${label}: ${formatOption(value)}`}
                accessibilityState={{ expanded: open }}
                onPress={() => setOpen((current) => !current)}
                style={({ pressed }) => [styles.control, open && styles.controlOpen, { opacity: pressed ? 0.8 : 1 }]}
            >
                <ThemedText variant="body">{formatOption(value)}</ThemedText>
                <Icon name="chev_d" size={20} color={colors.textSecondary} style={open ? styles.flipped : undefined} />
            </Pressable>
            {open ? (
                <View style={styles.list}>
                    {options.map((option) => {
                        const selected = option === value;
                        return (
                            <Pressable
                                key={option}
                                accessibilityRole="menuitem"
                                accessibilityState={{ selected }}
                                onPress={() => {
                                    onChange(option);
                                    setOpen(false);
                                }}
                                style={({ pressed }) => [styles.option, { opacity: pressed ? 0.7 : 1 }]}
                            >
                                <ThemedText variant="body" style={selected ? styles.optionSelected : undefined}>
                                    {formatOption(option)}
                                </ThemedText>
                                {selected ? <Icon name="check" size={18} color={colors.primary} /> : null}
                            </Pressable>
                        );
                    })}
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        gap: spacing.xs,
    },
    control: {
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    controlOpen: {
        borderWidth: 2,
        borderColor: colors.primary,
    },
    flipped: {
        transform: [{ rotate: '180deg' }],
    },
    list: {
        borderRadius: radius.md,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        overflow: 'hidden',
    },
    option: {
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
    },
    optionSelected: {
        fontFamily: fontFamily.bold,
        color: colors.primary,
    },
});
