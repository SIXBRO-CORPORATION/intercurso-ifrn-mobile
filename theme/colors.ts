
export const colors = {
    primary: '#2F9E41',
    primaryDark: '#1E7A30',
    primarySoft: '#E5F4E8',
    primaryMuted: '#BFE3C6',
    gradientPrimary: ['#2F9E41', '#1E7A30'] as const,

    danger: '#CD191E',
    dangerSoft: '#FCE7E7',

    warning: '#F2B705',
    warningSoft: '#FFF4CC',
    warningText: '#8A6700',

    ink: '#0F1A13',
    textSecondary: '#6B7A70',
    textMuted: '#A9B4AC',
    border: '#E1E7E2',
    field: '#F1F4F1',
    background: '#F5F7F4',
    surface: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof colors;
