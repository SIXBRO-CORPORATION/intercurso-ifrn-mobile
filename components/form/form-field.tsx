import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { colors, radius, spacing, textStyles } from '@/theme';

interface FormFieldProps extends TextInputProps {
    label: string;
    error?: string;
    hint?: string;
    showCount?: boolean;
}

export function FormField({
    label,
    error,
    hint,
    showCount,
    style,
    multiline,
    maxLength,
    value,
    onFocus,
    onBlur,
    ...inputProps
}: FormFieldProps) {
    const [focused, setFocused] = useState(false);

    const borderColor = error ? colors.danger : colors.primary;
    const borderWidth = error || focused ? 2 : 0;
    const count = typeof value === 'string' ? value.length : 0;

    return (
        <View style={styles.wrap}>
            <View style={styles.labelRow}>
                <ThemedText variant="caption">{label}</ThemedText>
                {showCount && maxLength != null ? (
                    <ThemedText variant="caption" style={styles.counter}>
                        {count}/{maxLength}
                    </ThemedText>
                ) : null}
            </View>
            <TextInput
                {...inputProps}
                value={value}
                maxLength={maxLength}
                accessibilityLabel={label}
                accessibilityState={{ invalid: !!error }}
                multiline={multiline}
                placeholderTextColor={colors.textMuted}
                onFocus={(event) => {
                    setFocused(true);
                    onFocus?.(event);
                }}
                onBlur={(event) => {
                    setFocused(false);
                    onBlur?.(event);
                }}
                style={[
                    styles.input,
                    textStyles.body,
                    { borderColor, borderWidth },
                    multiline && styles.multiline,
                    style,
                ]}
            />
            {error ? (
                <ThemedText variant="caption" accessibilityRole="alert" style={styles.errorText}>
                    {error}
                </ThemedText>
            ) : hint ? (
                <ThemedText variant="caption">{hint}</ThemedText>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        gap: spacing.xs,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    counter: {
        color: colors.textSecondary,
    },
    input: {
        minHeight: 48,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    multiline: {
        minHeight: 120,
        textAlignVertical: 'top',
    },
    errorText: {
        color: colors.danger,
    },
});
