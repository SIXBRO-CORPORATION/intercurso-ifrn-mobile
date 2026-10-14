
export const shadows = {
    card: '0 4px 12px rgba(15, 26, 19, 0.07)',
    sheet: '0 14px 22px rgba(15, 26, 19, 0.18)',
    primaryButton: '0 7px 9px rgba(15, 26, 19, 0.28)',
} as const;

export const liveGlow = (color: string) => `0 0 16px -4px ${color}`;
