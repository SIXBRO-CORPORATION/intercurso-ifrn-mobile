
import type { SeasonListFilters } from '@/types/season';
import type { TeamListFilters } from '@/types/team';

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
    teams: {
        all: ['teams'] as const,
        list: (filters?: TeamListFilters) => ['teams', 'list', filters ?? {}] as const,
        detail: (teamId: string) => ['teams', 'detail', teamId] as const,
        invite: (inviteToken: string) => ['teams', 'invite', inviteToken] as const,
    },
    brackets: {
        all: ['brackets'] as const,
        preview: (modalityId: string, format?: string) =>
            ['brackets', 'preview', modalityId, format ?? ''] as const,
    },
} as const;
