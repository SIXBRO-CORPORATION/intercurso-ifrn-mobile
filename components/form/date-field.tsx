import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { ThemedText } from '@/components/themed-text';
import { colors, radius, spacing, useBrandColors } from '@/theme';
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
    const brand = useBrandColors();
    const [androidOpen, setAndroidOpen] = useState(false);
    const formatValue = mode === 'datetime' ? formatPickerDateTime : formatPickerDate;

    return (
        <View style={styles.wrap}>
            <ThemedText variant="caption">{label}</ThemedText>
            <View style={styles.control}>
                {Platform.OS === 'ios' ? (
                    <DateTimePicker
                        mode={mode}
                        display="compact"
                        value={value}
                        minimumDate={minimumDate}
                        accentColor={brand.primary}
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
                                accentColor={brand.primary}
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
    control: {
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    iosPicker: {
        minWidth: 140,
        minHeight: 44,
    },
    androidButton: {
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.secondarySystemBackground as string,
    },
});
