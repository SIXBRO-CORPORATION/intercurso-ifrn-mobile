import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { ThemedText } from '@/components/themed-text';
import { colors, radius, spacing } from '@/theme';
import { formatPickerDate, formatPickerDateTime } from '@/utils/campus-time';

interface DateFieldProps {
    label: string;
    value: Date;
    onChange: (date: Date) => void;
    minimumDate?: Date;
    error?: string;
    hint?: string;
    mode?: 'date' | 'datetime';
}

export function DateField({ label, value, onChange, minimumDate, error, hint, mode = 'date' }: DateFieldProps) {
    const [androidOpen, setAndroidOpen] = useState(false);
    const formatValue = mode === 'datetime' ? formatPickerDateTime : formatPickerDate;
    const borderColor = error ? colors.danger : colors.primary;
    const borderWidth = error || androidOpen ? 2 : 0;

    return (
        <View style={styles.wrap}>
            <ThemedText variant="caption">{label}</ThemedText>
            <View style={[styles.control, { borderColor, borderWidth }]}>
                {Platform.OS === 'ios' ? (
                    <DateTimePicker
                        mode={mode}
                        display="compact"
                        value={value}
                        minimumDate={minimumDate}
                        accentColor={colors.primary}
                        onValueChange={(_, date) => onChange(date)}
                        style={styles.iosPicker}
                    />
                ) : (
                    <>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`${label}: ${formatValue(value)}. Alterar data`}
                            onPress={() => setAndroidOpen(true)}
                            style={({ pressed }) => [styles.androidButton, { opacity: pressed ? 0.7 : 1 }]}
                        >
                            <ThemedText variant="body">{formatValue(value)}</ThemedText>
                        </Pressable>
                        {androidOpen ? (
                            <DateTimePicker
                                mode={mode}
                                value={value}
                                minimumDate={minimumDate}
                                accentColor={colors.primary}
                                onValueChange={(_, date) => {
                                    setAndroidOpen(false);
                                    onChange(date);
                                }}
                                onDismiss={() => setAndroidOpen(false)}
                            />
                        ) : null}
                    </>
                )}
            </View>
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
    control: {
        minHeight: 48,
        justifyContent: 'center',
        alignItems: 'flex-start',
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
    },
    iosPicker: {
        minWidth: 140,
        minHeight: 48,
        marginLeft: spacing.sm,
    },
    androidButton: {
        minHeight: 48,
        width: '100%',
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
    },
    errorText: {
        color: colors.danger,
    },
});
