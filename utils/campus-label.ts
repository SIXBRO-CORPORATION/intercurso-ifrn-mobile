
const CAMPUS_NAME_BY_SIGLA: Record<string, string> = {
    PF: 'Pau dos Ferros',
    CNAT: 'Natal Central',
};

export function formatCampusLabel(campus: string | null | undefined): string | null {
    const trimmed = campus?.trim();
    if (!trimmed) return null;

    const knownName = CAMPUS_NAME_BY_SIGLA[trimmed.toUpperCase()];
    return `IFRN Campus ${knownName ?? trimmed}`;
}
