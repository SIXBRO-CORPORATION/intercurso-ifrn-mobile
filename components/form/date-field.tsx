import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { ThemedText } from '@/components/themed-text';
import { colors, radius, spacing, useBrandColors } from '@/theme';
import { formatPickerDate } from '@/utils/campus-time';

interface DateFieldProps {
    label: string;
    value: Date;
    onChange: (date: Date) => void;
    minimumDate?: Date;
    error?: string;
    hint?: string;
}

export function DateField({ label, value, onChange, minimumDate, error, hint }: DateFieldProps) {
    const brand = useBrandColors();
    const [androidOpen, setAndroidOpen] = useState(false);

    return (
        <View style={styles.wrap}>
            <ThemedText variant="caption">{label}</ThemedText>
            <View style={styles.control}>
                {Platform.OS === 'ios' ? (
                    <DateTimePicker
                        mode="date"
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
                            accessibilityLabel={`${label}: ${formatPickerDate(value)}. Alterar data`}
                            onPress={() => setAndroidOpen(true)}
                            style={({ pressed }) => [styles.androidButton, { opacity: pressed ? 0.7 : 1 }]}
                        >
                            <ThemedText variant="body">{formatPickerDate(value)}</ThemedText>
                        </Pressable>
                        {androidOpen ? (
                            <DateTimePicker
                                mode="date"
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
