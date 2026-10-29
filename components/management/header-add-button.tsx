import { Pressable, StyleSheet } from 'react-native';
import { router, type Href } from 'expo-router';
import { Icon } from '@/components/icon';
import { colors } from '@/theme';

type HeaderAddButtonProps = {
    href: Href;
    label: string;
};

export function HeaderAddButton({ href, label }: HeaderAddButtonProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => router.push(href)}
            hitSlop={8}
            style={styles.button}
        >
            <Icon name="plus" size={20} color={colors.ink} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.field,
    },
});

export function CancelButton() {
    return (
        <Pressable accessibilityRole="button" accessibilityLabel="Cancelar" onPress={() => router.back()} hitSlop={8}>
            <Icon name="close" size={24} color={colors.ink} />
        </Pressable>
    );
}
