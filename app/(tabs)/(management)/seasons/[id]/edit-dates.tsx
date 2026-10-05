import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/button';
import { DateField } from '@/components/form/date-field';
import { FormField } from '@/components/form/form-field';
import { ManagementGuard } from '@/components/management/management-guard';
import { ErrorState, LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useEditSeasonDates, useSeasonDetails } from '@/hooks/useSeasons';
import type { SeasonDetails, SeasonEditDatesRequest } from '@/types/season';
import { spacing, useBrandColors } from '@/theme';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { formatPickerDate, isoToPickerDate, pickerDateToIso } from '@/utils/campus-time';

type Mode = 'both' | 'start' | 'end';

function EditDatesForm({ season, mode }: { season: SeasonDetails; mode: Mode }) {
    const brand = useBrandColors();
    const editDates = useEditSeasonDates();

    const [start, setStart] = useState(() => isoToPickerDate(season.registration_start_date));
    const [end, setEnd] = useState(() => isoToPickerDate(season.registration_end_date));
    const [reason, setReason] = useState('');
    const [errors, setErrors] = useState<{ start?: string; end?: string }>({});
    const [submitError, setSubmitError] = useState<string | null>(null);

    const editsStart = mode !== 'end';
    const editsEnd = mode !== 'start';

    const startChanged = formatPickerDate(start) !== formatPickerDate(isoToPickerDate(season.registration_start_date));
    const endChanged = formatPickerDate(end) !== formatPickerDate(isoToPickerDate(season.registration_end_date));

    const handleSubmit = async () => {
        if (editDates.isPending) return;

        const next: typeof errors = {};
        const now = Date.now();
        const request: SeasonEditDatesRequest = {};
        const currentEnd = season.registration_end_date ? Date.parse(season.registration_end_date) : null;
        let effectiveStart = season.registration_start_date ? Date.parse(season.registration_start_date) : now;

        if (!(editsStart && startChanged) && !(editsEnd && endChanged)) {
            setSubmitError('Altere ao menos uma data antes de salvar.');
            return;
        }

        if (editsStart && startChanged) {
            if (Date.parse(pickerDateToIso(start, true)) < now) {
                next.start = 'A data de abertura não pode estar no passado.';
            } else {
                const startIso = pickerDateToIso(start, false);
                const sendIso = Date.parse(startIso) < now ? new Date(now + 60_000).toISOString() : startIso;
                effectiveStart = Date.parse(sendIso);
                if (!(editsEnd && endChanged) && currentEnd !== null && currentEnd <= effectiveStart) {
                    next.start = 'A abertura deve ser antes do fim das inscrições.';
                } else {
                    request.new_registration_start_date = sendIso;
                }
            }
        }

        if (editsEnd && endChanged) {
            const endIso = pickerDateToIso(end, true);
            if (Date.parse(endIso) <= now || Date.parse(endIso) <= effectiveStart) {
                next.end = 'O fim das inscrições deve ser depois do início.';
            } else {
                request.new_registration_end_date = endIso;
            }
        }

        setErrors(next);
        if (Object.keys(next).length > 0) return;

        if (reason.trim()) request.reason = reason.trim();
        setSubmitError(null);

        try {
            await editDates.mutateAsync({ seasonId: season.season_id, request });
            router.back();
        } catch (error) {
            setSubmitError(friendlyErrorMessage(error, 'Não foi possível atualizar as datas.'));
        }
    };

    return (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <ThemedText variant="subhead">{season.name}</ThemedText>

            {editsStart ? (
                <DateField
                    label="Início das inscrições"
                    value={start}
                    onChange={setStart}
                    minimumDate={new Date()}
                    error={errors.start}
                />
            ) : null}

            {editsEnd ? (
                <DateField
                    label="Fim das inscrições"
                    value={end}
                    onChange={setEnd}
                    minimumDate={new Date()}
                    hint="Inclui o dia inteiro, no horário de Natal."
                    error={errors.end}
                />
            ) : null}

            <FormField
                label="Motivo (opcional)"
                value={reason}
                onChangeText={setReason}
                maxLength={500}
                multiline
                hint="Fica registrado na auditoria."
            />

            {submitError ? (
                <ThemedText variant="caption" accessibilityRole="alert" style={{ color: brand.primary }}>
                    {submitError}
                </ThemedText>
            ) : null}

            <Button title="Salvar datas" onPress={handleSubmit} loading={editDates.isPending} />
        </ScrollView>
    );
}

function EditDatesContent() {
    const { id, mode } = useLocalSearchParams<{ id: string; mode?: Mode }>();
    const details = useSeasonDetails(id);

    if (details.isPending) return <LoadingState label="Carregando temporada…" />;

    if (details.isError) {
        return (
            <ErrorState
                title="Não foi possível carregar a temporada"
                description={friendlyErrorMessage(details.error, 'Tente de novo.')}
                onRetry={() => details.refetch()}
                retrying={details.isRefetching}
            />
        );
    }

    return <EditDatesForm season={details.data} mode={mode === 'start' || mode === 'end' ? mode : 'both'} />;
}

export default function EditSeasonDatesScreen() {
    return (
        <ManagementGuard>
            <EditDatesContent />
        </ManagementGuard>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        gap: spacing.md,
    },
});
