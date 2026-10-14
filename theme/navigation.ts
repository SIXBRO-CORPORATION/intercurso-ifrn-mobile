import { DefaultTheme } from 'expo-router/react-navigation';
import { colors } from './colors';

export const navigationTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.ink,
        border: colors.border,
        notification: colors.danger,
    },
};
