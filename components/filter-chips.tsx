import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { colors, onTint, radius, spacing, useBrandColors } from '@/theme';

export interface FilterChipOption<T extends string> {
    value: T;
    label: string;
}

interface FilterChipsProps<T extends string> {
    options: FilterChipOption<T>[];
    selected: T;
    onSelect: (value: T) => void;
    accessibilityLabel: string;
}

export function FilterChips<T extends string>({ options, selected, onSelect, accessibilityLabel }: FilterChipsProps<T>) {
    const brand = useBrandColors();

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
            accessibilityLabel={accessibilityLabel}
        >
            {options.map((option) => {
                const isSelected = option.value === selected;
                return (
                    <Pressable
                        key={option.value}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => onSelect(option.value)}
                        style={({ pressed }) => [
                            styles.chip,
                            {
                                backgroundColor: isSelected ? brand.primary : (colors.secondarySystemBackground as string),
                                opacity: pressed ? 0.7 : 1,
                            },
                        ]}
                    >
                        <ThemedText variant="subhead" style={{ color: isSelected ? onTint : undefined, fontWeight: isSelected ? '600' : '400' }}>
                            {option.label}
                        </ThemedText>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    chip: {
        minHeight: 36,
        paddingHorizontal: spacing.md,
        borderRadius: radius.full,
        justifyContent: 'center',
    },
});
