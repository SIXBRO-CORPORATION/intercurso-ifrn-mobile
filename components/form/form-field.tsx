import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { colors, radius, spacing, typography, useBrandColors } from '@/theme';

interface FormFieldProps extends TextInputProps {
    label: string;
    error?: string;
    hint?: string;
}

export function FormField({ label, error, hint, style, multiline, ...inputProps }: FormFieldProps) {
    const brand = useBrandColors();

    return (
        <View style={styles.wrap}>
            <ThemedText variant="caption">{label}</ThemedText>
            <TextInput
                {...inputProps}
                accessibilityLabel={label}
                multiline={multiline}
                placeholderTextColor={colors.secondaryLabel as string}
                style={[
                    styles.input,
                    { color: colors.label as string },
                    multiline && styles.multiline,
                    style,
                ]}
            />
            {error ? (
                <ThemedText variant="caption" accessibilityRole="alert" style={{ color: brand.primary }}>
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
        minHeight: 44,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.secondarySystemBackground as string,
        fontFamily: typography.body.fontFamily,
        fontSize: 17,
    },
    multiline: {
        minHeight: 120,
        textAlignVertical: 'top',
    },
});
