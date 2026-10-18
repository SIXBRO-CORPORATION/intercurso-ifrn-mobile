import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { Icon } from '@/components/icon';
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
    mode?: 'date' | 'datetime' | 'time';
}

type AndroidStep = 'closed' | 'date' | 'time';

function mergeDateAndTime(datePart: Date, timePart: Date): Date {
    const merged = new Date(datePart);
    merged.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
    return merged;
}


function formatPickerTime(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function DateField({ label, value, onChange, minimumDate, error, hint, mode = 'date' }: DateFieldProps) {
    const showDate = mode !== 'time';
    const showTime = mode === 'datetime' || mode === 'time';
    const leadingIcon = mode === 'time' ? 'clock' : 'calendar';
    const [androidStep, setAndroidStep] = useState<AndroidStep>('closed');
    const formatValue = mode === 'time' ? formatPickerTime : mode === 'datetime' ? formatPickerDateTime : formatPickerDate;
    const borderColor = error ? colors.danger : colors.primary;
    const borderWidth = error || androidStep !== 'closed' ? 2 : 0;

    return (
        <View style={styles.wrap}>
            <ThemedText variant="caption">{label}</ThemedText>
            <View style={[styles.control, { borderColor, borderWidth }]}>
                {Platform.OS === 'ios' ? (
                    <View style={styles.iosRow}>
                        <Icon name={leadingIcon} size={18} color={colors.textSecondary} />
                        {showDate ? (
                            <DateTimePicker
                                mode="date"
                                display="compact"
                                value={value}
                                minimumDate={minimumDate}
                                accentColor={colors.primary}
                                onValueChange={(_, date) => onChange(showTime ? mergeDateAndTime(date, value) : date)}
                                style={styles.iosPicker}
                            />
                        ) : null}
                        {showTime ? (
                            <DateTimePicker
                                mode="time"
                                display="compact"
                                value={value}
                                accentColor={colors.primary}
                                onValueChange={(_, time) => onChange(mergeDateAndTime(value, time))}
                                style={styles.iosPicker}
                            />
                        ) : null}
                    </View>
                ) : (
                    <>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`${label}: ${formatValue(value)}. Alterar ${showDate ? 'data' : 'hora'}`}
                            onPress={() => setAndroidStep(showDate ? 'date' : 'time')}
                            style={({ pressed }) => [styles.androidButton, { opacity: pressed ? 0.7 : 1 }]}
                        >
                            <Icon name={leadingIcon} size={18} color={colors.textSecondary} />
                            <ThemedText variant="body">{formatValue(value)}</ThemedText>
                        </Pressable>
                        {androidStep === 'date' ? (
                            <DateTimePicker
                                mode="date"
                                value={value}
                                minimumDate={minimumDate}
                                accentColor={colors.primary}
                                onValueChange={(_, date) => {
                                    if (showTime) {
                                        onChange(mergeDateAndTime(date, value));
                                        setAndroidStep('time');
                                    } else {
                                        onChange(date);
                                        setAndroidStep('closed');
                                    }
                                }}
                                onDismiss={() => setAndroidStep('closed')}
                            />
                        ) : null}
                        {androidStep === 'time' ? (
                            <DateTimePicker
                                mode="time"
                                value={value}
                                accentColor={colors.primary}
                                onValueChange={(_, time) => {
                                    onChange(mergeDateAndTime(value, time));
                                    setAndroidStep('closed');
                                }}
                                onDismiss={() => setAndroidStep('closed')}
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
    iosRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingLeft: spacing.md,
    },
    iosPicker: {
        minWidth: 118,
        minHeight: 48,
    },
    androidButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        minHeight: 48,
        width: '100%',
        justifyContent: 'flex-start',
        paddingHorizontal: spacing.md,
    },
    errorText: {
        color: colors.danger,
    },
});
