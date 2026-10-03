import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bracketService } from '@/services/bracket.service';
import { queryKeys } from '@/utils/query-keys';
import { ApiError } from '@/types/api';
import type { BracketCreateRequest, BracketPreviewParams } from '@/types/bracket';
import type { MatchUpdateRequest } from '@/types/match';

function isClientError(error: unknown): boolean {
    return error instanceof ApiError && error.status >= 400 && error.status < 500;
}

export function useBracketsBySeason(seasonId: string) {
    return useQuery({
        queryKey: queryKeys.brackets.bySeason(seasonId),
        queryFn: ({ signal }) => bracketService.listBracketsBySeason(seasonId, signal),
        enabled: !!seasonId,
    });
}

export function useBracketDetails(bracketId: string) {
    return useQuery({
        queryKey: queryKeys.brackets.detail(bracketId),
        queryFn: ({ signal }) => bracketService.getBracketDetails(bracketId, signal),
        enabled: !!bracketId,
        retry: (failureCount, error) => !isClientError(error) && failureCount < 1,
    });
}

export function useBracketMatches(bracketId: string) {
    return useQuery({
        queryKey: queryKeys.brackets.matches(bracketId),
        queryFn: ({ signal }) => bracketService.listBracketMatches(bracketId, signal),
        enabled: !!bracketId,
        retry: (failureCount, error) => !isClientError(error) && failureCount < 1,
    });
}

export function useBracketPreview(params: BracketPreviewParams | null) {
    return useQuery({
        queryKey: queryKeys.brackets.preview(params?.modality_id ?? '', params?.format),
        queryFn: ({ signal }) => bracketService.previewConfiguration(params!, signal),
        enabled: !!params?.modality_id && !!params?.format,
        retry: (failureCount, error) => !isClientError(error) && failureCount < 1,
    });
}

export function useCreateBracket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: BracketCreateRequest) => bracketService.createBracket(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
        },
    });
}

export function useResortBracket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (bracketId: string) => bracketService.resortBracket(bracketId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
        },
    });
}

interface UpdateMatchVariables {
    matchId: string;
    request: MatchUpdateRequest;
}

export function useUpdateMatch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ matchId, request }: UpdateMatchVariables) =>
            bracketService.updateMatch(matchId, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
        },
    });
}

export function useDeleteMatch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (matchId: string) => bracketService.deleteMatch(matchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
        },
    });
}
