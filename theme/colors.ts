import { Platform } from 'react-native';
import { Color } from 'expo-router';

export const colors = {
    label: Platform.select({
        ios: Color.ios.label,
        android: Color.android.dynamic.onSurface,
        default: '#000000',
    })!,
    secondaryLabel: Platform.select({
        ios: Color.ios.secondaryLabel,
        android: Color.android.dynamic.onSurfaceVariant,
        default: '#3C3C43',
    })!,
    separator: Platform.select({
        ios: Color.ios.separator,
        android: Color.android.dynamic.outlineVariant,
        default: '#C6C6C8',
    })!,
    systemBackground: Platform.select({
        ios: Color.ios.systemBackground,
        android: Color.android.dynamic.surface,
        default: '#FFFFFF',
    })!,
    secondarySystemBackground: Platform.select({
        ios: Color.ios.secondarySystemBackground,
        android: Color.android.dynamic.surfaceVariant,
        default: '#F2F2F7',
    })!,
};

// Marca: valores fixos por esquema de cor. Lidos via useBrandColors(), nunca em estilo estático.
export const brandPalette = {
    light: {
        primary: '#006B39',
        primaryDeep: '#003A18',
        accent: '#D01D21',
        live: '#D01D21',
        onAccent: '#FFFAF7',
    },
    dark: {
        primary: '#41AA66',
        primaryDeep: '#003A18',
        accent: '#E94740',
        live: '#41AA66',
        onAccent: '#FFFAF7',
    },
} as const;

// Texto sobre superfície de marca fica branco nos dois modos.
export const onTint = '#FFFFFF';
