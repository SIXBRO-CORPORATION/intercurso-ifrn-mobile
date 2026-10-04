import type { TextStyle } from 'react-native';
import { Archivo_400Regular } from '@expo-google-fonts/archivo/400Regular';
import { Archivo_600SemiBold } from '@expo-google-fonts/archivo/600SemiBold';
import { Barlow_700Bold } from '@expo-google-fonts/barlow/700Bold';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium';
import { colors } from './colors';

export const fonts = {
    Archivo_400Regular,
    Archivo_600SemiBold,
    Barlow_700Bold,
    JetBrainsMono_500Medium,
};

export const fontFamily = {
    text: 'Archivo_400Regular',
    textSemibold: 'Archivo_600SemiBold',
    display: 'Barlow_700Bold',
    mono: 'JetBrainsMono_500Medium',
} as const;

export const typography = {
    largeTitle: { fontFamily: fontFamily.display, fontSize: 34, color: colors.label },
    title: { fontFamily: fontFamily.display, fontSize: 22, color: colors.label },
    headline: { fontFamily: fontFamily.textSemibold, fontSize: 17, color: colors.label },
    body: { fontFamily: fontFamily.text, fontSize: 17, color: colors.label },
    subhead: { fontFamily: fontFamily.text, fontSize: 15, color: colors.secondaryLabel },
    caption: { fontFamily: fontFamily.text, fontSize: 12, color: colors.secondaryLabel },
    score: {
        fontFamily: fontFamily.display,
        fontSize: 40,
        color: colors.label,
        fontVariant: ['tabular-nums'],
    },
    code: { fontFamily: fontFamily.mono, fontSize: 11, color: colors.label },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
