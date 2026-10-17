import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { FormField } from '@/components/form/form-field';
import { Segmented } from '@/components/form/segmented';
import { Stepper } from '@/components/form/stepper';
import { Toggle } from '@/components/form/toggle';
import { ListRow } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { useCreateModality } from '@/hooks/useModalities';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import { ModalityGenderModeLabel, ScoreTypeLabel, type ModalityGenderMode, type ScoreType } from '@/types/enums';
import type { ModalityCreateRequest } from '@/types/modality';
import { colors, spacing } from '@/theme';

const GENDER_OPTIONS = (Object.keys(ModalityGenderModeLabel) as ModalityGenderMode[]).map((value) => ({
    value,
    label: ModalityGenderModeLabel[value],
}));

const SCORE_OPTIONS = (Object.keys(ScoreTypeLabel) as ScoreType[]).map((value) => ({
    value,
    label: ScoreTypeLabel[value],
}));

const DEFAULT_MIN_MEMBERS = 5;
const DEFAULT_MAX_MEMBERS = 12;
const DEFAULT_PERIODS = 2;
const DEFAULT_PERIOD_DURATION = 20;
const DEFAULT_POINTS_PER_SET = 25;
const DEFAULT_FINAL_SET_POINTS = 15;
const DEFAULT_SETS_TO_WIN = 2;
const MAX_MEMBERS_CAP = 99;

type Errors = Partial<Record<'name' | 'minFemale', string>>;

export default function CreateModalityScreen() {
    const createModality = useCreateModality();

    const [name, setName] = useState('');
    const [genderMode, setGenderMode] = useState<ModalityGenderMode>('MALE');
    const [minMembers, setMinMembers] = useState(DEFAULT_MIN_MEMBERS);
    const [maxMembers, setMaxMembers] = useState(DEFAULT_MAX_MEMBERS);
    const [minMale, setMinMale] = useState(0);
    const [minFemale, setMinFemale] = useState(0);
    const [periods, setPeriods] = useState(DEFAULT_PERIODS);
    const [periodDuration, setPeriodDuration] = useState(DEFAULT_PERIOD_DURATION);
    const [scoreType, setScoreType] = useState<ScoreType>('GOALS');
    const [hasThirdPlaceMatch, setHasThirdPlaceMatch] = useState(false);
    const [pointsPerSet, setPointsPerSet] = useState(DEFAULT_POINTS_PER_SET);
    const [finalSetPoints, setFinalSetPoints] = useState(DEFAULT_FINAL_SET_POINTS);
    const [setsToWin, setSetsToWin] = useState(DEFAULT_SETS_TO_WIN);
    const [errors, setErrors] = useState<Errors>({});
    const [submitError, setSubmitError] = useState<string | null>(null);

    const isSets = scoreType === 'SETS';
    const isMixed = genderMode === 'MIXED';

    const validate = (): Errors => {
        const next: Errors = {};

        if (!name.trim()) next.name = 'Informe o nome da modalidade.';

        if (isMixed) {
            const quota = minMale + minFemale;
            if (quota > maxMembers) {
                next.minFemale = 'A soma das cotas não pode passar do máximo de membros.';
            } else if (quota > minMembers) {
                next.minFemale = 'O mínimo de membros precisa cobrir a soma das cotas.';
            }
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
            min_members: minMembers,
            max_members: maxMembers,
            gender_mode: genderMode,
            ...(isMixed ? { min_male_members: minMale, min_female_members: minFemale } : {}),
            num_periods: periods,
            period_durations_minutes: periodDuration,
            score_type: scoreType,
            has_third_place_match: hasThirdPlaceMatch,
            ...(isSets
                ? { points_per_set: pointsPerSet, final_set_points: finalSetPoints, sets_to_win: setsToWin }
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
            <ThemedText variant="heading">Dados gerais</ThemedText>

            <FormField
                label="Nome da modalidade"
                value={name}
                onChangeText={setName}
                placeholder="Ex.: Futsal Masculino"
                maxLength={255}
                error={errors.name}
            />

            <View style={styles.field}>
                <ThemedText variant="caption">Regra de gênero</ThemedText>
                <Segmented options={GENDER_OPTIONS} value={genderMode} onChange={setGenderMode} />
                <ThemedText variant="caption">
                    Modalidades masculinas e femininas são cadastradas separadamente. Use “Mista” só para formatos
                    mistos.
                </ThemedText>
            </View>

            {isMixed ? (
                <>
                    <ListRow
                        title="Mínimo de homens"
                        emphasis="regular"
                        trailing={
                            <Stepper value={minMale} onChange={setMinMale} min={0} accessibilityLabel="Mínimo de homens" />
                        }
                    />
                    <ListRow
                        title="Mínimo de mulheres"
                        emphasis="regular"
                        trailing={
                            <Stepper
                                value={minFemale}
                                onChange={setMinFemale}
                                min={0}
                                accessibilityLabel="Mínimo de mulheres"
                            />
                        }
                    />
                    {errors.minFemale ? (
                        <ThemedText variant="caption" accessibilityRole="alert" style={styles.errorText}>
                            {errors.minFemale}
                        </ThemedText>
                    ) : null}
                </>
            ) : null}

            <ListRow
                title="Mínimo de membros"
                emphasis="regular"
                trailing={
                    <Stepper
                        value={minMembers}
                        onChange={setMinMembers}
                        min={1}
                        max={maxMembers}
                        accessibilityLabel="Mínimo de membros"
                    />
                }
            />
            <ListRow
                title="Máximo de membros"
                emphasis="regular"
                trailing={
                    <Stepper
                        value={maxMembers}
                        onChange={setMaxMembers}
                        min={minMembers}
                        max={MAX_MEMBERS_CAP}
                        accessibilityLabel="Máximo de membros"
                    />
                }
            />

            <ThemedText variant="heading" style={styles.sectionSpacing}>
                Configuração da partida
            </ThemedText>

            <ListRow
                title="Número de períodos"
                emphasis="regular"
                trailing={<Stepper value={periods} onChange={setPeriods} min={1} accessibilityLabel="Número de períodos" />}
            />
            <ListRow
                title="Duração do período (min)"
                emphasis="regular"
                trailing={
                    <Stepper
                        value={periodDuration}
                        onChange={setPeriodDuration}
                        min={1}
                        accessibilityLabel="Duração do período em minutos"
                    />
                }
            />

            <View style={styles.field}>
                <ThemedText variant="caption">Sistema de pontuação</ThemedText>
                <Segmented options={SCORE_OPTIONS} value={scoreType} onChange={setScoreType} />
            </View>

            {isSets ? (
                <>
                    <ListRow
                        title="Pontos por set"
                        emphasis="regular"
                        trailing={
                            <Stepper
                                value={pointsPerSet}
                                onChange={setPointsPerSet}
                                min={1}
                                accessibilityLabel="Pontos por set"
                            />
                        }
                    />
                    <ListRow
                        title="Pontos do set final"
                        emphasis="regular"
                        trailing={
                            <Stepper
                                value={finalSetPoints}
                                onChange={setFinalSetPoints}
                                min={1}
                                accessibilityLabel="Pontos do set final"
                            />
                        }
                    />
                    <ListRow
                        title="Sets para vencer"
                        emphasis="regular"
                        trailing={
                            <Stepper
                                value={setsToWin}
                                onChange={setSetsToWin}
                                min={1}
                                accessibilityLabel="Sets para vencer"
                            />
                        }
                    />
                </>
            ) : null}

            <ListRow
                title="Disputa de terceiro lugar"
                emphasis="regular"
                trailing={
                    <Toggle
                        value={hasThirdPlaceMatch}
                        onValueChange={setHasThirdPlaceMatch}
                        accessibilityLabel="Disputa de terceiro lugar"
                    />
                }
            />

            {submitError ? (
                <ThemedText variant="caption" accessibilityRole="alert" style={styles.errorText}>
                    {submitError}
                </ThemedText>
            ) : null}

            <Button title="Cadastrar modalidade" onPress={handleSubmit} loading={createModality.isPending} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        gap: spacing.sm,
    },
    field: {
        gap: spacing.xs,
    },
    sectionSpacing: {
        marginTop: spacing.sm,
    },
    errorText: {
        color: colors.danger,
    },
});
