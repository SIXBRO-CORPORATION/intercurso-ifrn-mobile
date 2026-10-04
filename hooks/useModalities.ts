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
