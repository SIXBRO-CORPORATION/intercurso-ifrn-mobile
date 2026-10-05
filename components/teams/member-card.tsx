import { Pressable, StyleSheet, View } from 'react-native';
import { Pill } from '@/components/teams/pill';
import { ThemedText } from '@/components/themed-text';
import { DonationStatusLabel, type DonationStatus } from '@/types/enums';
import { colors, onTint, radius, spacing, useBrandColors } from '@/theme';

const AVATAR_SIZE = 40;

export interface MemberAction {
    label: string;
    onPress: () => void;
    destructive?: boolean;
    disabled?: boolean;
}

interface MemberCardProps {
    name: string;
    subtitle?: string;
    isOwner: boolean;
    isCaptain: boolean;
    donation?: DonationStatus;
    actions?: MemberAction[];
    divider?: boolean;
}

function initials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function ActionButton({ action }: { action: MemberAction }) {
    const brand = useBrandColors();
    const tint = action.destructive ? brand.accent : brand.primary;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={action.label}
            accessibilityState={{ disabled: !!action.disabled }}
            disabled={action.disabled}
            onPress={action.onPress}
            style={({ pressed }) => [
                styles.action,
                { borderColor: tint, opacity: action.disabled ? 0.4 : pressed ? 0.6 : 1 },
            ]}
        >
            <ThemedText variant="subhead" style={{ color: tint, fontWeight: '600' }}>
                {action.label}
            </ThemedText>
        </Pressable>
    );
}

export function MemberCard({ name, subtitle, isOwner, isCaptain, donation, actions = [], divider }: MemberCardProps) {
    const brand = useBrandColors();

    const roles = [isOwner ? 'Dono' : null, isCaptain ? 'Capitão' : null].filter(Boolean).join(', ');
    const description = [name, roles, donation ? DonationStatusLabel[donation] : null].filter(Boolean).join(', ');

    return (
        <View
            style={[styles.card, divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator as string }]}
            accessible={actions.length === 0}
            accessibilityLabel={actions.length === 0 ? description : undefined}
        >
            <View style={styles.top}>
                <View
                    style={[
                        styles.avatar,
                        { backgroundColor: isOwner ? brand.primary : (colors.separator as string) },
                    ]}
                >
                    <ThemedText variant="caption" style={isOwner ? { color: onTint } : undefined}>
                        {initials(name)}
                    </ThemedText>
                </View>

                <View style={styles.texts}>
                    <ThemedText variant="headline" numberOfLines={1}>
                        {name}
                    </ThemedText>
                    {subtitle ? <ThemedText variant="caption">{subtitle}</ThemedText> : null}
                    {isOwner || isCaptain || donation ? (
                        <View style={styles.pills}>
                            {isOwner ? <Pill label="DONO" tone="outline" /> : null}
                            {isCaptain ? <Pill label="CAPITÃO" tone="outline" /> : null}
                            {donation ? (
                                <Pill
                                    label={donation === 'DONATION_CONFIRMED' ? 'DOAÇÃO CONFIRMADA' : 'DOAÇÃO PENDENTE'}
                                    tone={donation === 'DONATION_CONFIRMED' ? 'filled' : 'neutral'}
                                />
                            ) : null}
                        </View>
                    ) : null}
                </View>
            </View>

            {actions.length > 0 ? (
                <View style={styles.actions}>
                    {actions.map((action) => (
                        <ActionButton key={action.label} action={action} />
                    ))}
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        gap: spacing.sm,
        paddingVertical: spacing.sm,
    },
    top: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    texts: {
        flex: 1,
        gap: 2,
    },
    pills: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginTop: spacing.xs,
    },
    actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        paddingLeft: AVATAR_SIZE + spacing.md,
    },
    action: {
        minHeight: 36,
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderRadius: radius.full,
    },
});
