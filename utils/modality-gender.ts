import { ModalityGenderModeLabel, type ModalityGenderMode } from '@/types/enums';
import type { ModalitySummaryResponse } from '@/types/modality-list';

type MembersRange = Pick<ModalitySummaryResponse, 'min_members' | 'max_members'>;

interface GenderRuleSource {
    gender_mode?: ModalityGenderMode | null;
    min_male_members?: number | null;
    min_female_members?: number | null;
}

/** Faixa de integrantes ("3 por equipe" ou "3 a 5 por equipe"). Null quando os limites ainda não chegaram. */
export function formatMembersRange(min?: number | null, max?: number | null): string | null {
    if (min == null || max == null) return null;
    return min === max ? `${min} por equipe` : `${min} a ${max} por equipe`;
}

export function formatMembers(modality: MembersRange): string {
    return formatMembersRange(modality.min_members, modality.max_members) ?? '';
}

function plural(count: number, one: string, many: string): string {
    return `${count} ${count === 1 ? one : many}`;
}

export function formatGenderRule(modality: GenderRuleSource): string {
    if (!modality.gender_mode) return 'Gênero não informado';

    const label = ModalityGenderModeLabel[modality.gender_mode];

    if (modality.gender_mode !== 'MIXED') return label;

    const men = modality.min_male_members ?? 0;
    const women = modality.min_female_members ?? 0;
    return `${label} · mín. ${plural(men, 'homem', 'homens')} e ${plural(women, 'mulher', 'mulheres')}`;
}
