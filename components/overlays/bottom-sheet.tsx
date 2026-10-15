import { forwardRef, useCallback, useMemo, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
    type BottomSheetBackdropProps,
    type BottomSheetModal as BottomSheetModalRef,
} from '@gorhom/bottom-sheet';
import { ThemedText } from '@/components/themed-text';
import { colors, radius, spacing } from '@/theme';

export type BottomSheetHandle = BottomSheetModalRef;

interface BottomSheetProps {
    title?: string;
    description?: string;
    snapPoints?: (string | number)[];
    children?: ReactNode;
    onDismiss?: () => void;
}

export const BottomSheet = forwardRef<BottomSheetHandle, BottomSheetProps>(
    ({ title, description, snapPoints, children, onDismiss }, ref) => {
        const points = useMemo(() => snapPoints ?? ['50%'], [snapPoints]);

        const renderBackdrop = useCallback(
            (props: BottomSheetBackdropProps) => (
                <BottomSheetBackdrop
                    {...props}
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                    opacity={0.5}
                    pressBehavior="close"
                    style={[props.style, styles.backdrop]}
                />
            ),
            []
        );

        return (
            <BottomSheetModal
                ref={ref}
                snapPoints={points}
                onDismiss={onDismiss}
                backdropComponent={renderBackdrop}
                handleIndicatorStyle={styles.handle}
                handleStyle={styles.handleContainer}
                backgroundStyle={styles.sheet}
            >
                <BottomSheetView style={styles.content}>
                    {title ? (
                        <ThemedText variant="title" style={styles.title}>
                            {title}
                        </ThemedText>
                    ) : null}
                    {description ? (
                        <ThemedText variant="body" style={styles.description}>
                            {description}
                        </ThemedText>
                    ) : null}
                    {children}
                </BottomSheetView>
            </BottomSheetModal>
        );
    }
);

BottomSheet.displayName = 'BottomSheet';

const styles = StyleSheet.create({
    backdrop: {
        backgroundColor: colors.ink,
    },
    sheet: {
        borderTopLeftRadius: radius.hero,
        borderTopRightRadius: radius.hero,
    },
    handleContainer: {
        paddingTop: spacing.sm,
        paddingBottom: spacing.xs,
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: radius.pill,
        backgroundColor: colors.border,
    },
    content: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
        gap: spacing.sm,
    },
    title: {},
    description: {
        color: colors.textSecondary,
    },
});
