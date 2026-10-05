import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { FormField } from '@/components/form/form-field';
import { ThemedText } from '@/components/themed-text';
import { useAllModalities } from '@/hooks/useModalities';
import { useCreateSeason, useSeasons } from '@/hooks/useSeasons';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import type { SeasonCreateRequest } from '@/types/season';
import { colors, radius, spacing, useBrandColors } from '@/theme';
import { getCampusYear, parseCampusDateInput } from '@/utils/campus-time';

type Errors = Partial<Record<'name' | 'year' | 'modalities' | 'startDate' | 'endDate', string>>;

function parseYear(text: string): number | null {
    if (!/^\d{4}$/.test(text.trim())) return null;
    const year = Number(text);
    return year >= 2000 && year <= 2100 ? year : null;
}

export default function CreateSeasonScreen() {
    const brand = useBrandColors();
    const modalities = useAllModalities();
    const createSeason = useCreateSeason();
    const seasons = useSeasons();
    const activeSeason = seasons.data?.find((season) => season.active);

    const [name, setName] = useState('');
    const [year, setYear] = useState(String(getCampusYear()));
    const [modalityIds, setModalityIds] = useState<string[]>([]);
    const [openImmediately, setOpenImmediately] = useState(false);
    const openNow = openImmediately && !activeSeason;
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [rulesDocument, setRulesDocument] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [submitError, setSubmitError] = useState<string | null>(null);

    const toggleModality = (id: string) =>
        setModalityIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

    const validate = (): Errors => {
        const next: Errors = {};

        if (!name.trim()) next.name = 'Informe o nome da temporada.';

        if (!parseYear(year)) next.year = 'Informe um ano entre 2000 e 2100.';

        if (modalityIds.length === 0) next.modalities = 'Selecione ao menos uma modalidade.';

        const end = parseCampusDateInput(endDate, true);
        if (!end) next.endDate = 'Use o formato dd/mm/aaaa.';

        if (!openNow) {
            const start = parseCampusDateInput(startDate, false);
            if (!start) {
                next.startDate = 'Use o formato dd/mm/aaaa.';
            } else if (end && Date.parse(start) > Date.parse(end)) {
                next.endDate = 'O fim das inscrições deve ser depois do início.';
            }
        }

        return next;
    };

    const handleSubmit = async () => {
        if (createSeason.isPending) return;

        const nextErrors = validate();
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitError(null);

        const request: SeasonCreateRequest = {
            name: name.trim(),
            year: parseYear(year)!,
            modality_ids: modalityIds,
            registration_end_date: parseCampusDateInput(endDate, true)!,
            open_immediately: openNow,
            rules_document: rulesDocument.trim() || undefined,
            ...(openNow ? {} : { registration_start_date: parseCampusDateInput(startDate, false)! }),
        };

        try {
            await createSeason.mutateAsync(request);
            router.back();
        } catch (error) {
            setSubmitError(friendlyErrorMessage(error, 'Não foi possível criar a temporada.'));
        }
    };

    const renderModalities = () => {
        if (modalities.isPending) {
            return <ThemedText variant="caption">Carregando modalidades…</ThemedText>;
        }

        if (modalities.isError) {
            return <ThemedText variant="caption">Não foi possível carregar as modalidades.</ThemedText>;
        }

        const options = modalities.data ?? [];

        if (options.length === 0) {
            return (
                <ThemedText variant="caption">
                    Nenhuma modalidade ativa. Cadastre uma modalidade antes de criar a temporada.
                </ThemedText>
            );
        }

        return (
            <View style={styles.chips}>
                {options.map((modality) => {
                    const selected = modalityIds.includes(modality.modality_id);
                    return (
                        <Pressable
                            key={modality.modality_id}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: selected }}
                            onPress={() => toggleModality(modality.modality_id)}
                            style={[
                                styles.chip,
                                { backgroundColor: selected ? brand.primary : (colors.secondarySystemBackground as string) },
                            ]}
                        >
                            <ThemedText variant="subhead" style={selected ? styles.chipSelectedText : undefined}>
                                {modality.name}
                            </ThemedText>
                        </Pressable>
                    );
                })}
            </View>
        );
    };

    return (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <FormField
                label="Nome"
                value={name}
                onChangeText={setName}
                placeholder="Ex.: Intercurso 2026"
                error={errors.name}
                maxLength={255}
            />

            <FormField
                label="Ano"
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                maxLength={4}
                error={errors.year}
            />

            <View style={styles.field}>
                <ThemedText variant="caption">Modalidades</ThemedText>
                {renderModalities()}
                {errors.modalities ? (
                    <ThemedText variant="caption" accessibilityRole="alert" style={{ color: brand.primary }}>
                        {errors.modalities}
                    </ThemedText>
                ) : null}
            </View>

            <View style={styles.switchRow}>
                <ThemedText variant="headline" style={styles.switchLabel}>
                    Abrir inscrições agora
                </ThemedText>
                <Switch
                    value={openNow}
                    onValueChange={setOpenImmediately}
                    disabled={!!activeSeason}
                    accessibilityLabel="Abrir inscrições agora"
                />
            </View>
            {activeSeason ? (
                <ThemedText variant="caption">
                    “{activeSeason.name}” ainda está ativa. Finalize-a antes de abrir as inscrições de outra temporada.
                </ThemedText>
            ) : null}

            {!openNow ? (
                <FormField
                    label="Início das inscrições"
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="dd/mm/aaaa"
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                    hint="Se houver temporada ativa nessa data, a abertura é adiada até ela ser finalizada."
                    error={errors.startDate}
                />
            ) : null}

            <FormField
                label="Fim das inscrições"
                value={endDate}
                onChangeText={setEndDate}
                placeholder="dd/mm/aaaa"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                hint="Inclui o dia inteiro, no horário de Natal."
                error={errors.endDate}
            />

            <FormField
                label="Regulamento (opcional)"
                value={rulesDocument}
                onChangeText={setRulesDocument}
                multiline
                placeholder="Texto do regulamento"
            />

            {submitError ? (
                <ThemedText variant="caption" accessibilityRole="alert" style={{ color: brand.primary }}>
                    {submitError}
                </ThemedText>
            ) : null}

            <Button title="Criar temporada" onPress={handleSubmit} loading={createSeason.isPending} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        gap: spacing.md,
    },
    field: {
        gap: spacing.xs,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    chip: {
        minHeight: 36,
        paddingHorizontal: spacing.md,
        borderRadius: radius.full,
        justifyContent: 'center',
    },
    chipSelectedText: {
        color: '#FFFFFF',
        fontWeight: '600',
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
