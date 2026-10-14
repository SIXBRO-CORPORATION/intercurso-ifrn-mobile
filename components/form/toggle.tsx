import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, motion } from '@/theme';

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 22;
const THUMB_MARGIN = (TRACK_HEIGHT - THUMB_SIZE) / 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_MARGIN * 2;

interface ToggleProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
    accessibilityLabel?: string;
}

export function Toggle({ value, onValueChange, disabled = false, accessibilityLabel }: ToggleProps) {
    const progress = useSharedValue(value ? 1 : 0);

    useEffect(() => {
        progress.value = withTiming(value ? 1 : 0, { duration: motion.base, easing: motion.easing });
    }, [value, progress]);

    const trackStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(progress.value, [0, 1], [colors.border, colors.primary]),
    }));

    const thumbStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: THUMB_MARGIN + progress.value * THUMB_TRAVEL }],
    }));

    return (
        <Pressable
            accessibilityRole="switch"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ checked: value, disabled }}
            disabled={disabled}
            onPress={() => onValueChange(!value)}
            hitSlop={8}
            style={disabled ? styles.disabled : undefined}
        >
            <Animated.View style={[styles.track, trackStyle]}>
                <Animated.View style={[styles.thumb, thumbStyle]} />
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    track: {
        width: TRACK_WIDTH,
        height: TRACK_HEIGHT,
        borderRadius: TRACK_HEIGHT / 2,
        justifyContent: 'center',
    },
    thumb: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        backgroundColor: colors.surface,
        boxShadow: '0 1px 3px rgba(15, 26, 19, 0.25)',
    },
    disabled: {
        opacity: 0.5,
    },
});
