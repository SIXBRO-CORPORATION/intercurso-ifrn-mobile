import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { colors, fontFamily, motion, radius, spacing } from '@/theme';

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

    const isReady = trackWidth > 0;

    const handleLayout = (event: LayoutChangeEvent) => {
        const width = event.nativeEvent.layout.width;
        if (width === trackWidth) return;

        if (trackWidth === 0 && width > 0) {
            const initialSegmentWidth = (width - TRACK_PADDING * 2) / (options.length || 1);
            indicatorX.value = initialSegmentWidth * selectedIndex;
        }

        setTrackWidth(width);
    };

    useEffect(() => {
        if (!isReady) return;
        indicatorX.value = withTiming(segmentWidth * selectedIndex, { duration: motion.base, easing: motion.easing });
    }, [isReady, segmentWidth, selectedIndex, indicatorX]);

    const indicatorStyle = useAnimatedStyle(() => ({
        width: segmentWidth,
        transform: [{ translateX: indicatorX.value }],
    }));

    return (
        <View style={[styles.track, disabled && styles.disabled]} onLayout={handleLayout}>
            {isReady ? <Animated.View style={[styles.indicator, indicatorStyle]} /> : null}
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
                        style={[styles.segment, !isReady && selected && styles.segmentFallback]}
                        hitSlop={4}
                    >
                        <ThemedText variant="label" numberOfLines={1} style={selected ? styles.labelSelected : styles.label}>
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
    segmentFallback: {
        borderRadius: radius.pill,
        backgroundColor: colors.primary,
    },
    label: {
        color: colors.textSecondary,
    },
    labelSelected: {
        color: colors.surface,
        fontFamily: fontFamily.bold,
    },
    disabled: {
        opacity: 0.5,
    },
});
