import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { colors, radius, spacing, textStyles } from '@/theme';

interface FormFieldProps extends TextInputProps {
    label: string;
    error?: string;
    hint?: string;
}

export function FormField({ label, error, hint, style, multiline, onFocus, onBlur, ...inputProps }: FormFieldProps) {
    const [focused, setFocused] = useState(false);

    const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

    return (
        <View style={styles.wrap}>
            <ThemedText variant="caption">{label}</ThemedText>
            <TextInput
                {...inputProps}
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
                    { borderColor, borderWidth: focused || error ? 1.5 : 1 },
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
