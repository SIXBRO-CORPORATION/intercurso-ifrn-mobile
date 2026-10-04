import { Pressable } from 'react-native';
import { router, type Href } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useBrandColors } from '@/theme';

interface HeaderAddButtonProps {
    href: Href;
    label: string;
}

export function HeaderAddButton({ href, label }: HeaderAddButtonProps) {
    const brand = useBrandColors();

    return (
        <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push(href)} hitSlop={8}>
            <ThemedText variant="headline" style={{ color: brand.primary }}>
                Nova
            </ThemedText>
        </Pressable>
    );
}

export function CancelButton() {
    return (
        <Pressable accessibilityRole="button" accessibilityLabel="Cancelar" onPress={() => router.back()} hitSlop={8}>
            <ThemedText variant="headline">Cancelar</ThemedText>
        </Pressable>
    );
}
