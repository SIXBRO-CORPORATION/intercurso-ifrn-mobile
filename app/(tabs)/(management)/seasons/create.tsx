import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { Button } from '@/components/button';
import { Checkbox } from '@/components/form/checkbox';
import { DateField } from '@/components/form/date-field';
import { FormField } from '@/components/form/form-field';
import { SelectField } from '@/components/form/select-field';
import { Icon } from '@/components/icon';
import { ConfirmDialog } from '@/components/overlays/confirm-dialog';
import { LoadingState } from '@/components/states/screen-states';
import { ThemedText } from '@/components/themed-text';
import { useAllModalities } from '@/hooks/useModalities';
import { useCreateSeason, useSeasonOverview } from '@/hooks/useSeasons';
import { useToast } from '@/providers/ToastProvider';
import { friendlyErrorMessage } from '@/utils/api-error-message';
import type { SeasonCreateRequest, SeasonRulesDocumentFile } from '@/types/season';
import { colors, radius, shadows, spacing } from '@/theme';
import { getCampusYear, pickerDateTimeToIso } from '@/utils/campus-time';

const YEARS_BEFORE = 1;
const YEARS_AFTER = 4;
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

function CreateSeasonForm() {
    const modalities = useAllModalities();
    const createSeason = useCreateSeason();
    const toast = useToast();
    const insets = useSafeAreaInsets();

    const [name, setName] = useState('');
    const [year, setYear] = useState(getCampusYear());
    const yearOptions = useMemo(() => {
        const base = getCampusYear();
        return Array.from({ length: YEARS_BEFORE + YEARS_AFTER + 1 }, (_, index) => base - YEARS_BEFORE + index);
    }, []);
    const [modalityIds, setModalityIds] = useState<string[]>([]);
    const [openImmediately, setOpenImmediately] = useState(false);
    const openNow = openImmediately;
    const [startDate, setStartDate] = useState(() => new Date());
    const [endDate, setEndDate] = useState(() => new Date(Date.now() + DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000));
    const [rulesDocument, setRulesDocument] = useState<SeasonRulesDocumentFile | null>(null);
    const [rulesDocumentSize, setRulesDocumentSize] = useState<number | null>(null);
    const [errors, setErrors] = useState<Errors>({});
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [modalitiesExpanded, setModalitiesExpanded] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

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

    const handleReview = () => {
        if (createSeason.isPending) return;

        const nextErrors = validate();
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitError(null);
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        if (createSeason.isPending) return;

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
            const created = await createSeason.mutateAsync(request);
            setConfirmOpen(false);
            toast.success('Temporada criada com sucesso');
            router.replace(`/seasons/${created.season_id}`);
        } catch (error) {
            setConfirmOpen(false);
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
        <View style={styles.screen}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
                <View style={styles.banner} accessibilityRole="summary">
                    <View style={styles.bannerIcon}>
                        <Icon name="info" size={20} color={colors.surface} />
                    </View>
                    <View style={styles.bannerTexts}>
                        <ThemedText variant="section">Esta será a temporada atual</ThemedText>
                        <ThemedText variant="bodySm" style={styles.bannerSubtitle}>
                            Só é possível ter uma por vez.
                        </ThemedText>
                    </View>
                </View>

                <FormField
                    label="Nome da temporada"
                    value={name}
                    onChangeText={setName}
                    placeholder="Ex.: Intercurso 2026"
                    error={errors.name}
                    maxLength={255}
                />

                <SelectField label="Ano de referência" value={year} options={yearOptions} onChange={setYear} />

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
                />

                <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: openNow }}
                    onPress={() => setOpenImmediately((current) => !current)}
                    style={styles.checkboxRow}
                >
                    <Checkbox
                        value={openNow}
                        onValueChange={setOpenImmediately}
                        accessibilityLabel="Abrir inscrições imediatamente"
                    />
                    <ThemedText variant="bodyLg" style={styles.checkboxLabel}>
                        Abrir inscrições imediatamente
                    </ThemedText>
                </Pressable>

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

            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
                <Button title="Criar temporada" onPress={handleReview} loading={createSeason.isPending} />
            </View>

            <ConfirmDialog
                visible={confirmOpen}
                icon="calendar"
                title={`Criar ${name.trim()}?`}
                description="Ela passa a ser a temporada atual do app. Enquanto não for finalizada, não será possível criar outra."
                confirmLabel="Criar temporada"
                cancelLabel="Revisar dados"
                confirming={createSeason.isPending}
                onConfirm={handleConfirm}
                onCancel={() => setConfirmOpen(false)}
            />
        </View>
    );
}

export default function CreateSeasonScreen() {
    const overview = useSeasonOverview();
    const createSeason = useCreateSeason();

    if (overview.isPending) {
        return <LoadingState label="Carregando…" />;
    }

    // F07: só existe uma temporada por vez. Se já há uma não finalizada, abre a atual.
    if (overview.current && !createSeason.isPending && !createSeason.isSuccess) {
        return <Redirect href={`/seasons/${overview.current.season_id}`} />;
    }

    return <CreateSeasonForm />;
}


const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.md,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.sm,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.primarySoft,
    },
    bannerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
    },
    bannerTexts: {
        flex: 1,
        gap: 2,
    },
    bannerSubtitle: {
        color: colors.textSecondary,
    },
    footer: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        backgroundColor: colors.surface,
        boxShadow: shadows.card,
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
