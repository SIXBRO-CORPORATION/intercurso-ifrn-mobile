import { DarkTheme, DefaultTheme } from 'expo-router/react-navigation';
import { brandPalette } from './colors';

export const lightNav = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: brandPalette.light.primary,
        notification: brandPalette.light.live,
    },
};

export const darkNav = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        primary: brandPalette.dark.primary,
        notification: brandPalette.dark.live,
    },
};
