import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { FilterChips, type FilterChipOption } from '@/components/filter-chips';
import { FormField } from '@/components/form/form-field';
import { ThemedText } from '@/components/themed-text';
import { useCreateModality } from '@/hooks/useModalities';
import { ApiError } from '@/types/api';
import { ScoreTypeLabel, type ScoreType } from '@/types/enums';
import type { ModalityCreateRequest } from '@/types/modality';
import { spacing, useBrandColors } from '@/theme';

type Field =
    | 'name'
    | 'minMembers'
    | 'maxMembers'
    | 'periods'
    | 'periodDuration'
    | 'pointsPerSet'
    | 'finalSetPoints'
    | 'setsToWin';

type Errors = Partial<Record<Field, string>>;

const SCORE_OPTIONS: FilterChipOption<ScoreType>[] = (Object.keys(ScoreTypeLabel) as ScoreType[]).map((value) => ({
    value,
    label: ScoreTypeLabel[value],
}));

function parsePositive(text: string): number | null {
    if (!/^\d+$/.test(text.trim())) return null;
    const value = Number(text);
    return value >= 1 ? value : null;
}

export default function CreateModalityScreen() {
    const brand = useBrandColors();
    const createModality = useCreateModality();

    const [name, setName] = useState('');
    const [minMembers, setMinMembers] = useState('');
    const [maxMembers, setMaxMembers] = useState('');
    const [periods, setPeriods] = useState('');
    const [periodDuration, setPeriodDuration] = useState('');
    const [scoreType, setScoreType] = useState<ScoreType>('GOALS');
    const [hasThirdPlaceMatch, setHasThirdPlaceMatch] = useState(false);
    const [pointsPerSet, setPointsPerSet] = useState('');
    const [finalSetPoints, setFinalSetPoints] = useState('');
    const [setsToWin, setSetsToWin] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [submitError, setSubmitError] = useState<string | null>(null);

    const isSets = scoreType === 'SETS';

    const validate = (): Errors => {
        const next: Errors = {};

        if (!name.trim()) next.name = 'Informe o nome da modalidade.';

        const min = parsePositive(minMembers);
        const max = parsePositive(maxMembers);
        if (!min) next.minMembers = 'Informe um número maior que zero.';
        if (!max) next.maxMembers = 'Informe um número maior que zero.';
        if (min && max && min > max) next.maxMembers = 'O máximo não pode ser menor que o mínimo.';

        if (!parsePositive(periods)) next.periods = 'Informe um número de períodos maior que zero.';
        if (!parsePositive(periodDuration)) next.periodDuration = 'Informe a duração em minutos.';

        if (isSets) {
            if (!parsePositive(pointsPerSet)) next.pointsPerSet = 'Informe os pontos por set.';
            if (!parsePositive(finalSetPoints)) next.finalSetPoints = 'Informe os pontos do set final.';
            if (!parsePositive(setsToWin)) next.setsToWin = 'Informe quantos sets são necessários para vencer.';
        }

        return next;
    };

    const handleSubmit = async () => {
        if (createModality.isPending) return;

        const nextErrors = validate();
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitError(null);

        const request: ModalityCreateRequest = {
            name: name.trim(),
            min_members: parsePositive(minMembers)!,
            max_members: parsePositive(maxMembers)!,
            num_periods: parsePositive(periods)!,
            period_durations_minutes: parsePositive(periodDuration)!,
            score_type: scoreType,
            has_third_place_match: hasThirdPlaceMatch,
            ...(isSets
                ? {
                      points_per_set: parsePositive(pointsPerSet)!,
                      final_set_points: parsePositive(finalSetPoints)!,
                      sets_to_win: parsePositive(setsToWin)!,
                  }
                : {}),
        };

        try {
            await createModality.mutateAsync(request);
            router.back();
        } catch (error) {
            setSubmitError(error instanceof ApiError ? error.message : 'Não foi possível criar a modalidade.');
        }
    };

    return (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <FormField
                label="Nome"
                value={name}
                onChangeText={setName}
                placeholder="Ex.: Futsal masculino"
                maxLength={255}
                error={errors.name}
            />

            <View style={styles.row}>
                <View style={styles.half}>
                    <FormField
                        label="Mín. membros"
                        value={minMembers}
                        onChangeText={setMinMembers}
                        keyboardType="number-pad"
                        error={errors.minMembers}
                    />
                </View>
                <View style={styles.half}>
                    <FormField
                        label="Máx. membros"
                        value={maxMembers}
                        onChangeText={setMaxMembers}
                        keyboardType="number-pad"
                        error={errors.maxMembers}
                    />
                </View>
            </View>

            <View style={styles.row}>
                <View style={styles.half}>
                    <FormField
                        label="Períodos"
                        value={periods}
                        onChangeText={setPeriods}
                        keyboardType="number-pad"
                        error={errors.periods}
                    />
                </View>
                <View style={styles.half}>
                    <FormField
                        label="Min. por período"
                        value={periodDuration}
                        onChangeText={setPeriodDuration}
                        keyboardType="number-pad"
                        error={errors.periodDuration}
                    />
                </View>
            </View>

            <View style={styles.field}>
                <ThemedText variant="caption">Pontuação</ThemedText>
                <FilterChips
                    accessibilityLabel="Tipo de pontuação"
                    options={SCORE_OPTIONS}
                    selected={scoreType}
                    onSelect={setScoreType}
                />
            </View>

            {isSets ? (
                <>
                    <FormField
                        label="Pontos por set"
                        value={pointsPerSet}
                        onChangeText={setPointsPerSet}
                        keyboardType="number-pad"
                        error={errors.pointsPerSet}
                    />
                    <FormField
                        label="Pontos do set final"
                        value={finalSetPoints}
                        onChangeText={setFinalSetPoints}
                        keyboardType="number-pad"
                        error={errors.finalSetPoints}
                    />
                    <FormField
                        label="Sets para vencer"
                        value={setsToWin}
                        onChangeText={setSetsToWin}
                        keyboardType="number-pad"
                        error={errors.setsToWin}
                    />
                </>
            ) : null}

            <View style={styles.switchRow}>
                <ThemedText variant="headline" style={styles.switchLabel}>
                    Disputa de 3º lugar
                </ThemedText>
                <Switch value={hasThirdPlaceMatch} onValueChange={setHasThirdPlaceMatch} />
            </View>

            {submitError ? (
                <ThemedText variant="caption" accessibilityRole="alert" style={{ color: brand.primary }}>
                    {submitError}
                </ThemedText>
            ) : null}

            <Button title="Criar modalidade" onPress={handleSubmit} loading={createModality.isPending} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        gap: spacing.md,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    half: {
        flex: 1,
    },
    field: {
        gap: spacing.xs,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    switchLabel: {
        flex: 1,
    },
});
