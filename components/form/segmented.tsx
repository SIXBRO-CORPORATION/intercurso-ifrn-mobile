import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { colors, motion, radius, spacing } from '@/theme';

const TRACK_PADDING = spacing.xxs;

interface SegmentedOption<T extends string> {
    label: string;
    value: T;
}

interface SegmentedProps<T extends string> {
    options: SegmentedOption<T>[];
    value: T;
    onChange: (value: T) => void;
    disabled?: boolean;
}

export function Segmented<T extends string>({ options, value, onChange, disabled = false }: SegmentedProps<T>) {
    const [trackWidth, setTrackWidth] = useState(0);
    const indicatorX = useSharedValue(0);

    const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
    const segmentWidth = trackWidth > 0 ? (trackWidth - TRACK_PADDING * 2) / (options.length || 1) : 0;

    const handleLayout = (event: LayoutChangeEvent) => {
        setTrackWidth(event.nativeEvent.layout.width);
    };

    useEffect(() => {
        indicatorX.value = withTiming(segmentWidth * selectedIndex, { duration: motion.base, easing: motion.easing });
    }, [segmentWidth, selectedIndex, indicatorX]);

    const indicatorStyle = useAnimatedStyle(() => ({
        width: segmentWidth,
        transform: [{ translateX: indicatorX.value }],
    }));

    return (
        <View style={[styles.track, disabled && styles.disabled]} onLayout={handleLayout}>
            {trackWidth > 0 ? <Animated.View style={[styles.indicator, indicatorStyle]} /> : null}
            {options.map((option, index) => {
                const selected = index === selectedIndex;
                return (
                    <Pressable
                        key={option.value}
                        accessibilityRole="button"
                        accessibilityLabel={option.label}
                        accessibilityState={{ selected, disabled }}
                        disabled={disabled}
                        onPress={() => onChange(option.value)}
                        style={styles.segment}
                        hitSlop={4}
                    >
                        <ThemedText variant="label" style={selected ? styles.labelSelected : styles.label}>
                            {option.label}
                        </ThemedText>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    track: {
        flexDirection: 'row',
        padding: TRACK_PADDING,
        borderRadius: radius.pill,
        backgroundColor: colors.field,
        position: 'relative',
    },
    indicator: {
        position: 'absolute',
        top: TRACK_PADDING,
        bottom: TRACK_PADDING,
        left: TRACK_PADDING,
        borderRadius: radius.pill,
        backgroundColor: colors.primary,
    },
    segment: {
        flex: 1,
        paddingVertical: spacing.xs,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        color: colors.textSecondary,
    },
    labelSelected: {
        color: colors.surface,
    },
    disabled: {
        opacity: 0.5,
    },
});
