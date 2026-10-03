import { useMutation, useQueryClient } from '@tanstack/react-query';
import { modalityService } from '@/services/modality.service';
import { queryKeys } from '@/utils/query-keys';
import type { ModalityCreateRequest } from '@/types/modality';

export function useCreateModality() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: ModalityCreateRequest) =>
            modalityService.createModality(request),
        onSuccess: () => {
            // Sem GET de listagem ainda (ver TODO em types/modality.ts); a
            // invalidação fica pronta para quando o endpoint existir.
            queryClient.invalidateQueries({ queryKey: queryKeys.modalities.all });
        },
    });
}
