import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { modalityService } from '@/services/modality.service';
import { queryKeys } from '@/utils/query-keys';
import type { ModalityCreateRequest } from '@/types/modality';

export function useModalities(seasonId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.modalities.list(seasonId),
        queryFn: ({ signal }) => modalityService.listModalities(seasonId, signal),
        enabled: !!seasonId,
    });
}

export function useCreateModality() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: ModalityCreateRequest) =>
            modalityService.createModality(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.modalities.all });
        },
    });
}

export function useAllModalities() {
    return useQuery({
        queryKey: queryKeys.modalities.list(),
        queryFn: ({ signal }) => modalityService.listModalities(undefined, signal),
    });
}

export function useModalitiesAdmin() {
    return useQuery({
        queryKey: queryKeys.modalities.admin(),
        queryFn: ({ signal }) => modalityService.listModalitiesAdmin(signal),
    });
}

export function useUpdateModalityActive() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ modalityId, active }: { modalityId: string; active: boolean }) =>
            modalityService.updateModalityActive(modalityId, active),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.modalities.all });
        },
    });
}
