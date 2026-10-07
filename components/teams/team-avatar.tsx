import { Image, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { radius, useBrandColors } from '@/theme';

function initialsOf(name: string): string {
    const letters = name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join('');
    return letters || '?';
}

export function TeamAvatar({ name, photo, size = 48 }: { name: string; photo?: string | null; size?: number }) {
    const brand = useBrandColors();
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

    return (
        <View accessible={false} style={[styles.base, box, { backgroundColor: brand.primary }]}>
            <ThemedText variant="headline" style={styles.initials}>
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
    initials: {
        color: '#FFFFFF',
    },
});
