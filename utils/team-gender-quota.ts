import type { TeamMember, TeamModalityRules } from '@/types/team';

export interface GenderQuota {
    male: number;
    female: number;
    missingMale: number;
    missingFemale: number;
    satisfied: boolean;
}

export function countGenders(members: Pick<TeamMember, 'gender'>[]): { male: number; female: number } {
    let male = 0;
    let female = 0;
    for (const member of members) {
        if (member.gender === 'M') male += 1;
        if (member.gender === 'F') female += 1;
    }
    return { male, female };
}

export function getGenderQuota(
    rules: Pick<TeamModalityRules, 'gender_mode' | 'min_male_members' | 'min_female_members'>,
    members: Pick<TeamMember, 'gender'>[]
): GenderQuota | null {
    if (rules.gender_mode !== 'MIXED') return null;

    const { male, female } = countGenders(members);
    const missingMale = Math.max(0, (rules.min_male_members ?? 0) - male);
    const missingFemale = Math.max(0, (rules.min_female_members ?? 0) - female);

    return { male, female, missingMale, missingFemale, satisfied: missingMale === 0 && missingFemale === 0 };
}

export function describeMissingQuota(quota: GenderQuota): string | null {
    const parts: string[] = [];
    if (quota.missingMale > 0) {
        parts.push(`${quota.missingMale} ${quota.missingMale === 1 ? 'homem' : 'homens'}`);
    }
    if (quota.missingFemale > 0) {
        parts.push(`${quota.missingFemale} ${quota.missingFemale === 1 ? 'mulher' : 'mulheres'}`);
    }
    if (parts.length === 0) return null;
    return `Falta cota de gênero: ${parts.join(' e ')}.`;
}
