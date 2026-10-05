import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { MenuView, type NativeActionEvent } from '@expo/ui/community/menu';
import { ThemedText } from '@/components/themed-text';
import { DonationStatusLabel } from '@/types/enums';
import type { TeamMember } from '@/types/team';
import { colors, spacing } from '@/theme';

interface MemberRowProps {
    member: TeamMember;
    isOwner: boolean;
    isCaptain: boolean;
    showDonation: boolean;
    onMakeCaptain?: () => void;
    onRemove?: () => void;
}

export function MemberRow({ member, isOwner, isCaptain, showDonation, onMakeCaptain, onRemove }: MemberRowProps) {
    const actions = useMemo(
        () => [
            ...(onMakeCaptain && !isCaptain ? [{ id: 'captain', title: 'Definir capitão' }] : []),
            ...(onRemove && !isOwner ? [{ id: 'remove', title: 'Remover do time', attributes: { destructive: true } }] : []),
        ],
        [onMakeCaptain, onRemove, isCaptain, isOwner]
    );

    const roles = [isOwner ? 'Dono' : null, isCaptain ? 'Capitão' : null].filter(Boolean).join(' · ');
    const donation = showDonation ? DonationStatusLabel[member.donation_status] : null;
    const details = [roles, donation].filter(Boolean).join(' · ');

    const handlePress = ({ nativeEvent }: NativeActionEvent) => {
        if (nativeEvent.event === 'captain') onMakeCaptain?.();
        if (nativeEvent.event === 'remove') onRemove?.();
    };

    const content = (
        <View
            style={styles.row}
            accessible
            accessibilityLabel={`${member.name}${details ? `, ${details}` : ''}${actions.length ? '. Toque para ver ações' : ''}`}
        >
            <View style={styles.texts}>
                <ThemedText variant="headline" numberOfLines={1}>
                    {member.name}
                </ThemedText>
                {details ? <ThemedText variant="caption">{details}</ThemedText> : null}
            </View>
            {actions.length > 0 ? (
                <ThemedText variant="title" style={styles.more}>
                    ⋯
                </ThemedText>
            ) : null}
        </View>
    );

    if (actions.length === 0) return content;

    return (
        <MenuView actions={actions} onPressAction={handlePress}>
            {content}
        </MenuView>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 44,
    },
    texts: {
        flex: 1,
        gap: 2,
    },
    more: {
        color: colors.secondaryLabel as string,
    },
});
