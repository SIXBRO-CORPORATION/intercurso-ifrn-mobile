import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { seasonService } from '@/services/season.service';
import { queryKeys } from '@/utils/query-keys';
import { ApiError } from '@/types/api';
import type {
    SeasonCreateRequest,
    SeasonEditDatesRequest,
    SeasonFinishRequest,
    SeasonListFilters,
    SeasonReopenRequest,
} from '@/types/season';

export function useSeasons(filters?: SeasonListFilters) {
    return useQuery({
        queryKey: queryKeys.seasons.list(filters),
        queryFn: () => seasonService.listSeasons(filters),
    });
}

export function useSeasonDetails(seasonId: string) {
    return useQuery({
        queryKey: queryKeys.seasons.detail(seasonId),
        queryFn: () => seasonService.getSeasonDetails(seasonId),
        enabled: !!seasonId,
    });
}


export function useActiveSeason() {
    return useQuery({
        queryKey: queryKeys.seasons.active(),
        queryFn: () => seasonService.getActiveSeason(),
        retry: (failureCount, error) => {
            if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                return false;
            }
            return failureCount < 3;
        },
    });
}

export function useCreateSeason() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: SeasonCreateRequest) => seasonService.createSeason(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.seasons.all });
        },
    });
}

interface SeasonIdVariables {
    seasonId: string;
}

interface EditSeasonDatesVariables extends SeasonIdVariables {
    request: SeasonEditDatesRequest;
}

export function useEditSeasonDates() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ seasonId, request }: EditSeasonDatesVariables) =>
            seasonService.editSeasonDates(seasonId, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.seasons.all });
        },
    });
}

export function useCloseSeasonRegistration() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ seasonId }: SeasonIdVariables) =>
            seasonService.closeRegistration(seasonId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.seasons.all });
        },
    });
}

interface ReopenSeasonRegistrationVariables extends SeasonIdVariables {
    request: SeasonReopenRequest;
}

export function useReopenSeasonRegistration() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ seasonId, request }: ReopenSeasonRegistrationVariables) =>
            seasonService.reopenRegistration(seasonId, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.seasons.all });
        },
    });
}

interface FinishSeasonVariables extends SeasonIdVariables {
    request: SeasonFinishRequest;
}

export function useFinishSeason() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ seasonId, request }: FinishSeasonVariables) =>
            seasonService.finishSeason(seasonId, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.seasons.all });
        },
    });
}
