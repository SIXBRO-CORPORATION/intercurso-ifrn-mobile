import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/icon';
import { Pill } from '@/components/teams/pill';
import { ThemedText } from '@/components/themed-text';
import { DonationStatusLabel, type DonationStatus } from '@/types/enums';
import { colors, radius, spacing } from '@/theme';

const AVATAR_SIZE = 40;

const AVATAR_TONES: { background: string; foreground: string }[] = [
    { background: colors.primarySoft, foreground: colors.primaryDark },
    { background: colors.dangerSoft, foreground: colors.danger },
    { background: colors.warningSoft, foreground: colors.warningText },
];

function initialOf(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
}

function toneOf(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) | 0;
    }
    return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

export function MemberAvatar({ name, size = AVATAR_SIZE }: { name: string; size?: number }) {
    const tone = toneOf(name);

    return (
        <View
            style={[
                styles.avatar,
                { width: size, height: size, borderRadius: size / 2, backgroundColor: tone.background },
            ]}
        >
            <ThemedText variant="section" style={{ color: tone.foreground }}>
                {initialOf(name)}
            </ThemedText>
        </View>
    );
}

interface MemberCardProps {
    name: string;
    isOwner: boolean;
    isCaptain: boolean;
    donation?: DonationStatus;
    onPress?: () => void;
}

export function MemberCard({ name, isOwner, isCaptain, donation, onPress }: MemberCardProps) {
    const donationConfirmed = donation === 'DONATION_CONFIRMED';

    const accessibilityLabel = [
        name,
        isOwner ? 'Dono' : null,
        isCaptain ? 'Capitão' : null,
        donation ? DonationStatusLabel[donation] : null,
    ]
        .filter(Boolean)
        .join(', ');

    const content = (
        <View style={styles.row}>
            <MemberAvatar name={name} />
            <View style={styles.texts}>
                <ThemedText variant="section" numberOfLines={1}>
                    {name}
                </ThemedText>
                {donation ? (
                    <ThemedText
                        variant="bodySm"
                        style={{ color: donationConfirmed ? colors.primaryDark : colors.warningText }}
                    >
                        {DonationStatusLabel[donation]}
                    </ThemedText>
                ) : isOwner || isCaptain ? (
                    <View style={styles.pills}>
                        {isOwner ? <Pill label="Dono" tone="dark" /> : null}
                        {isCaptain ? <Pill label="Capitão" tone="soft" /> : null}
                    </View>
                ) : null}
            </View>
            {donation ? (
                <View
                    style={[
                        styles.statusDot,
                        { backgroundColor: donationConfirmed ? colors.primary : colors.warning },
                    ]}
                >
                    <Icon name={donationConfirmed ? 'check' : 'clock'} size={14} color={colors.surface} />
                </View>
            ) : onPress ? (
                <Icon name="more" size={20} color={colors.textMuted} />
            ) : null}
        </View>
    );

    if (!onPress) {
        return (
            <View style={styles.card} accessible accessibilityLabel={accessibilityLabel}>
                {content}
            </View>
        );
    }

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ações de ${name}`}
            onPress={onPress}
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.7 : 1 }]}
        >
            {content}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: radius.md,
        borderCurve: 'continuous',
        backgroundColor: colors.field,
        padding: spacing.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    avatar: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    texts: {
        flex: 1,
        gap: 2,
    },
    pills: {
        flexDirection: 'row',
        gap: spacing.xs,
        marginTop: 2,
    },
    statusDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
