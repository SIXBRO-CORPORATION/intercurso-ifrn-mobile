import { ModalityGenderModeLabel } from '@/types/enums';
import type { ModalitySummaryResponse } from '@/types/modality-list';

export function formatMembers(modality: Pick<ModalitySummaryResponse, 'min_members' | 'max_members'>): string {
    return modality.min_members === modality.max_members
        ? `${modality.min_members} por equipe`
        : `${modality.min_members} a ${modality.max_members} por equipe`;
}

function plural(count: number, one: string, many: string): string {
    return `${count} ${count === 1 ? one : many}`;
}

export function formatGenderRule(
    modality: Pick<ModalitySummaryResponse, 'gender_mode' | 'min_male_members' | 'min_female_members'>
): string {
    const label = ModalityGenderModeLabel[modality.gender_mode];

    if (modality.gender_mode !== 'MIXED') return label;

    const men = modality.min_male_members ?? 0;
    const women = modality.min_female_members ?? 0;
    return `${label} · mín. ${plural(men, 'homem', 'homens')} e ${plural(women, 'mulher', 'mulheres')}`;
}
