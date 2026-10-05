import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { FilterChips, type FilterChipOption } from '@/components/filter-chips';
import { FormField } from '@/components/form/form-field';
import { ThemedText } from '@/components/themed-text';
import { useCreateModality } from '@/hooks/useModalities';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { ModalityGenderModeLabel, ScoreTypeLabel, type ModalityGenderMode, type ScoreType } from '@/types/enums';
import type { ModalityCreateRequest } from '@/types/modality';
import { spacing, useBrandColors } from '@/theme';

type Field =
    | 'name'
    | 'minMembers'
    | 'maxMembers'
    | 'minMale'
    | 'minFemale'
    | 'periods'
    | 'periodDuration'
    | 'pointsPerSet'
    | 'finalSetPoints'
    | 'setsToWin';

type Errors = Partial<Record<Field | 'gender', string>>;

const SCORE_OPTIONS: FilterChipOption<ScoreType>[] = (Object.keys(ScoreTypeLabel) as ScoreType[]).map((value) => ({
    value,
    label: ScoreTypeLabel[value],
}));

const GENDER_OPTIONS: FilterChipOption<ModalityGenderMode>[] = (
    Object.keys(ModalityGenderModeLabel) as ModalityGenderMode[]
).map((value) => ({ value, label: ModalityGenderModeLabel[value] }));

function parseNonNegative(text: string): number | null {
    return /^\d+$/.test(text.trim()) ? Number(text) : null;
}

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
    const [genderMode, setGenderMode] = useState<ModalityGenderMode | null>(null);
    const [minMale, setMinMale] = useState('');
    const [minFemale, setMinFemale] = useState('');
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
    const isMixed = genderMode === 'MIXED';

    const validate = (): Errors => {
        const next: Errors = {};

        if (!name.trim()) next.name = 'Informe o nome da modalidade.';

        const min = parsePositive(minMembers);
        const max = parsePositive(maxMembers);
        if (!min) next.minMembers = 'Informe um número maior que zero.';
        if (!max) next.maxMembers = 'Informe um número maior que zero.';
        if (min && max && min > max) next.maxMembers = 'O máximo não pode ser menor que o mínimo.';

        if (!genderMode) next.gender = 'Escolha a regra de gênero da modalidade.';

        if (isMixed) {
            const male = parseNonNegative(minMale);
            const female = parseNonNegative(minFemale);
            if (male === null) next.minMale = 'Informe um número (pode ser 0).';
            if (female === null) next.minFemale = 'Informe um número (pode ser 0).';

            if (male !== null && female !== null) {
                const quota = male + female;
                if (max && quota > max) {
                    next.minFemale = 'A soma das cotas não pode passar do máximo de membros.';
                } else if (min && quota > min) {
                    next.minFemale = 'O mínimo de membros precisa cobrir a soma das cotas.';
                }
            }
        }

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
            gender_mode: genderMode!,
            ...(isMixed
                ? { min_male_members: parseNonNegative(minMale)!, min_female_members: parseNonNegative(minFemale)! }
                : {}),
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
            setSubmitError(friendlyErrorMessage(error, 'Não foi possível criar a modalidade.'));
        }
    };

    return (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <FormField
                label="Nome"
                value={name}
                onChangeText={setName}
                placeholder="Ex.: Futsal Masculino"
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

            <View style={styles.field}>
                <ThemedText variant="caption">Regra de gênero</ThemedText>
                <FilterChips
                    accessibilityLabel="Regra de gênero da modalidade"
                    options={GENDER_OPTIONS}
                    selected={genderMode as ModalityGenderMode}
                    onSelect={setGenderMode}
                />
                {errors.gender ? (
                    <ThemedText variant="caption" accessibilityRole="alert" style={{ color: brand.primary }}>
                        {errors.gender}
                    </ThemedText>
                ) : (
                    <ThemedText variant="caption">
                        Modalidades masculinas e femininas são cadastradas separadamente. Use “Mista” só para formatos
                        mistos.
                    </ThemedText>
                )}
            </View>

            {isMixed ? (
                <View style={styles.row}>
                    <View style={styles.half}>
                        <FormField
                            label="Mín. homens"
                            value={minMale}
                            onChangeText={setMinMale}
                            keyboardType="number-pad"
                            error={errors.minMale}
                        />
                    </View>
                    <View style={styles.half}>
                        <FormField
                            label="Mín. mulheres"
                            value={minFemale}
                            onChangeText={setMinFemale}
                            keyboardType="number-pad"
                            error={errors.minFemale}
                        />
                    </View>
                </View>
            ) : null}

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
