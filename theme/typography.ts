import type { TextStyle } from 'react-native';
import { Poppins_400Regular } from '@expo-google-fonts/poppins/400Regular';
import { Poppins_500Medium } from '@expo-google-fonts/poppins/500Medium';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { colors } from './colors';

export const fonts = {
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
};

export const fontFamily = {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    bold: 'Poppins_700Bold',
} as const;

export const textStyles = {
    largeTitle: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 34, color: colors.ink },
    title: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 30, color: colors.ink },
    heading: { fontFamily: fontFamily.bold, fontSize: 20, lineHeight: 26, color: colors.ink },
    section: { fontFamily: fontFamily.bold, fontSize: 17, lineHeight: 24, color: colors.ink },
    bodyLg: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 24, color: colors.ink },
    body: { fontFamily: fontFamily.medium, fontSize: 15, lineHeight: 22, color: colors.ink },
    bodySm: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20, color: colors.ink },
    label: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 18, color: colors.ink },
    caption: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
    overline: {
        fontFamily: fontFamily.bold,
        fontSize: 11,
        lineHeight: 14,
        letterSpacing: 1.6,
        color: colors.textSecondary,
        textTransform: 'uppercase',
    },
    button: { fontFamily: fontFamily.bold, fontSize: 16, lineHeight: 24, color: colors.surface },
    timer: {
        fontFamily: fontFamily.bold,
        fontSize: 20,
        lineHeight: 24,
        color: colors.ink,
        fontVariant: ['tabular-nums'],
    },
} satisfies Record<string, TextStyle>;

export type TextStyleVariant = keyof typeof textStyles;
