import { Easing } from 'react-native';

export const motion = {
    fast: 150,
    base: 250,
    slow: 400,
    easing: Easing.out(Easing.cubic),
    spring: { damping: 14, stiffness: 180 },
} as const;
