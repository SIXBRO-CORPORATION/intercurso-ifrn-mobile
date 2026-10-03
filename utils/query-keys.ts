
export const queryKeys = {
    users: {
        all: ['users'] as const,
        detail: (userId: string) => ['users', userId] as const,
    },
    modalities: {
        all: ['modalities'] as const,
        detail: (modalityId: string) => ['modalities', modalityId] as const,
    },
} as const;
