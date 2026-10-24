import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Button } from '@/components/button';
import { Checkbox } from '@/components/form/checkbox';
import { DateField } from '@/components/form/date-field';
import { FormField } from '@/components/form/form-field';
import { Stepper } from '@/components/form/stepper';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { useAllModalities } from '@/hooks/useModalities';
import { useActiveSeason, useCreateSeason } from '@/hooks/useSeasons';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import type { SeasonCreateRequest, SeasonRulesDocumentFile } from '@/types/season';
import { colors, radius, spacing } from '@/theme';
import { getCampusYear, pickerDateTimeToIso } from '@/utils/campus-time';

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;
const VISIBLE_MODALITIES = 6;
const DEFAULT_WINDOW_DAYS = 10;
const MAX_RULES_DOCUMENT_BYTES = 10 * 1024 * 1024;
const RULES_DOCUMENT_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

type Errors = Partial<Record<'name' | 'modalities' | 'endDate' | 'rulesDocument', string>>;

function formatFileSize(bytes: number): string {
    const megabytes = bytes / (1024 * 1024);
    if (megabytes >= 1) return `${megabytes.toFixed(1).replace('.', ',')} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function CreateSeasonScreen() {
    const modalities = useAllModalities();
    const createSeason = useCreateSeason();
    const activeSeasonQuery = useActiveSeason();
    const activeSeason = activeSeasonQuery.data;

    const [name, setName] = useState('');
    const [year, setYear] = useState(getCampusYear());
    const [modalityIds, setModalityIds] = useState<string[]>([]);
    const [openImmediately, setOpenImmediately] = useState(false);
    const openNow = openImmediately && !activeSeason;
    const [startDate, setStartDate] = useState(() => new Date());
    const [endDate, setEndDate] = useState(() => new Date(Date.now() + DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000));
    const [rulesDocument, setRulesDocument] = useState<SeasonRulesDocumentFile | null>(null);
    const [rulesDocumentSize, setRulesDocumentSize] = useState<number | null>(null);
    const [errors, setErrors] = useState<Errors>({});
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [modalitiesExpanded, setModalitiesExpanded] = useState(false);

    const toggleModality = (id: string) =>
        setModalityIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

    const pickRulesDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: RULES_DOCUMENT_TYPES,
            copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets?.[0]) return;

        const asset = result.assets[0];
        const mimeType = asset.mimeType ?? RULES_DOCUMENT_TYPES[0];

        if (!RULES_DOCUMENT_TYPES.includes(mimeType)) {
            setErrors((current) => ({ ...current, rulesDocument: 'Envie um arquivo PDF ou DOCX.' }));
            return;
        }

        if (asset.size && asset.size > MAX_RULES_DOCUMENT_BYTES) {
            setErrors((current) => ({ ...current, rulesDocument: 'O arquivo deve ter no máximo 10 MB.' }));
            return;
        }

        setErrors((current) => ({ ...current, rulesDocument: undefined }));
        setRulesDocument({ uri: asset.uri, name: asset.name, type: mimeType });
        setRulesDocumentSize(asset.size ?? null);
    };

    const validate = (): Errors => {
        const next: Errors = {};

        if (!name.trim()) next.name = 'Informe o nome da temporada.';

        if (modalityIds.length === 0) next.modalities = 'Selecione ao menos uma modalidade.';

        if (!openNow && endDate.getTime() <= startDate.getTime()) {
            next.endDate = 'O fim das inscrições deve ser depois do início.';
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
            year,
            modality_ids: modalityIds,
            registration_end_date: pickerDateTimeToIso(endDate),
            open_immediately: openNow,
            rules_document: rulesDocument,
            ...(openNow ? {} : { registration_start_date: pickerDateTimeToIso(startDate) }),
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

        const ordered = [...options].sort((a, b) => {
            const aSelected = modalityIds.includes(a.modality_id) ? 0 : 1;
            const bSelected = modalityIds.includes(b.modality_id) ? 0 : 1;
            return aSelected - bSelected;
        });
        const hasOverflow = !modalitiesExpanded && ordered.length > VISIBLE_MODALITIES;
        const visible = hasOverflow ? ordered.slice(0, VISIBLE_MODALITIES) : ordered;
        const hiddenCount = ordered.length - visible.length;

        return (
            <View style={styles.chips}>
                {visible.map((modality) => {
                    const selected = modalityIds.includes(modality.modality_id);
                    return (
                        <Pressable
                            key={modality.modality_id}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: selected }}
                            onPress={() => toggleModality(modality.modality_id)}
                            style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.field }]}
                        >
                            {selected ? <Icon name="check" size={16} color={colors.surface} /> : null}
                            <ThemedText variant="label" style={selected ? styles.chipSelectedText : undefined}>
                                {modality.name}
                            </ThemedText>
                        </Pressable>
                    );
                })}
                {hiddenCount > 0 ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Mostrar mais ${hiddenCount} modalidades`}
                        onPress={() => setModalitiesExpanded(true)}
                        style={[styles.chip, { backgroundColor: colors.field }]}
                    >
                        <ThemedText variant="label">+ {hiddenCount}</ThemedText>
                    </Pressable>
                ) : null}
            </View>
        );
    };

    return (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <FormField
                label="Nome da temporada"
                value={name}
                onChangeText={setName}
                placeholder="Ex.: Intercurso 2026"
                error={errors.name}
                maxLength={255}
            />

            <View style={styles.field}>
                <ThemedText variant="caption">Ano de referência</ThemedText>
                <Stepper
                    value={year}
                    onChange={setYear}
                    min={MIN_YEAR}
                    max={MAX_YEAR}
                    accessibilityLabel="Ano de referência"
                />
            </View>

            <View style={styles.field}>
                <ThemedText variant="caption">Modalidades</ThemedText>
                {renderModalities()}
                {errors.modalities ? (
                    <ThemedText variant="caption" accessibilityRole="alert" style={styles.errorText}>
                        {errors.modalities}
                    </ThemedText>
                ) : null}
            </View>

            {!openNow ? (
                <DateField
                    label="Abertura das inscrições"
                    mode="datetime"
                    value={startDate}
                    onChange={setStartDate}
                />
            ) : null}

            <DateField
                label="Encerramento das inscrições"
                mode="datetime"
                value={endDate}
                onChange={setEndDate}
                error={errors.endDate}
                hint="Se houver temporada ativa na data de abertura, ela é adiada até essa temporada ser finalizada."
            />

            <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: openNow, disabled: !!activeSeason }}
                disabled={!!activeSeason}
                onPress={() => setOpenImmediately((current) => !current)}
                style={styles.checkboxRow}
            >
                <Checkbox
                    value={openNow}
                    onValueChange={setOpenImmediately}
                    disabled={!!activeSeason}
                    accessibilityLabel="Abrir inscrições imediatamente"
                />
                <ThemedText variant="bodyLg" style={styles.checkboxLabel}>
                    Abrir inscrições imediatamente
                </ThemedText>
            </Pressable>
            {activeSeason ? (
                <ThemedText variant="caption">
                    “{activeSeason.name}” ainda está ativa. Finalize-a antes de abrir as inscrições de outra temporada.
                </ThemedText>
            ) : null}

            <View style={styles.field}>
                <ThemedText variant="caption">Regulamento (PDF ou DOCX) · opcional</ThemedText>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={rulesDocument ? 'Trocar regulamento' : 'Selecionar regulamento'}
                    onPress={pickRulesDocument}
                    style={({ pressed }) => [
                        styles.documentPicker,
                        rulesDocument && styles.documentPickerFilled,
                        { opacity: pressed ? 0.85 : 1 },
                    ]}
                >
                    <View style={styles.documentIcon}>
                        <Icon name="file" size={20} color={rulesDocument ? colors.primary : colors.textMuted} />
                    </View>
                    {rulesDocument ? (
                        <View style={styles.documentTexts}>
                            <ThemedText variant="section" numberOfLines={1}>
                                {rulesDocument.name}
                            </ThemedText>
                            <ThemedText variant="caption" style={styles.documentHint}>
                                {rulesDocumentSize ? `${formatFileSize(rulesDocumentSize)} · ` : ''}toque para trocar
                            </ThemedText>
                        </View>
                    ) : (
                        <ThemedText variant="body" style={styles.documentPlaceholder}>
                            Selecionar arquivo
                        </ThemedText>
                    )}
                </Pressable>
                {errors.rulesDocument ? (
                    <ThemedText variant="caption" accessibilityRole="alert" style={styles.errorText}>
                        {errors.rulesDocument}
                    </ThemedText>
                ) : null}
            </View>

            {submitError ? (
                <ThemedText variant="caption" accessibilityRole="alert" style={styles.errorText}>
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        minHeight: 40,
        paddingHorizontal: spacing.md,
        borderRadius: radius.pill,
        justifyContent: 'center',
    },
    chipSelectedText: {
        color: colors.surface,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    checkboxLabel: {
        flex: 1,
    },
    documentPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        minHeight: 56,
        padding: spacing.sm,
        borderRadius: radius.md,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    documentPickerFilled: {
        borderColor: colors.primaryMuted,
        backgroundColor: colors.primarySoft,
    },
    documentIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.field,
    },
    documentTexts: {
        flex: 1,
        gap: 2,
    },
    documentHint: {
        color: colors.textSecondary,
    },
    documentPlaceholder: {
        color: colors.textMuted,
    },
    errorText: {
        color: colors.danger,
    },
});
