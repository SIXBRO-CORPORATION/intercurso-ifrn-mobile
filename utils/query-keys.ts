
import type { SeasonListFilters } from '@/types/season';

export const queryKeys = {
    users: {
        all: ['users'] as const,
        detail: (userId: string) => ['users', userId] as const,
    },
    modalities: {
        all: ['modalities'] as const,
        detail: (modalityId: string) => ['modalities', modalityId] as const,
    },
    seasons: {
        all: ['seasons'] as const,
        list: (filters?: SeasonListFilters) => ['seasons', 'list', filters ?? {}] as const,
        active: () => ['seasons', 'active'] as const,
        detail: (seasonId: string) => ['seasons', 'detail', seasonId] as const,
    },
} as const;
