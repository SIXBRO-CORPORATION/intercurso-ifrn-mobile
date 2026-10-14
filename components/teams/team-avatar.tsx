import { Image, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { colors, radius } from '@/theme';

interface Tone {
    background: string;
    foreground: string;
}

const PALETTE: Tone[] = [
    { background: colors.primarySoft, foreground: colors.primaryDark },
    { background: colors.dangerSoft, foreground: colors.danger },
    { background: colors.warningSoft, foreground: colors.warningText },
];

function initialsOf(name: string): string {
    const letters = name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join('');
    return letters || '?';
}

function toneOf(name: string): Tone {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) | 0;
    }
    return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function TeamAvatar({ name, photo, size = 48 }: { name: string; photo?: string | null; size?: number }) {
    const box = { width: size, height: size, borderRadius: radius.md };

    if (photo) {
        return (
            <Image
                source={{ uri: photo }}
                accessible={false}
                accessibilityIgnoresInvertColors
                style={[styles.base, box]}
            />
        );
    }

    const tone = toneOf(name);

    return (
        <View accessible={false} style={[styles.base, box, { backgroundColor: tone.background }]}>
            <ThemedText variant="section" style={{ color: tone.foreground }}>
                {initialsOf(name)}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderCurve: 'continuous',
    },
});
