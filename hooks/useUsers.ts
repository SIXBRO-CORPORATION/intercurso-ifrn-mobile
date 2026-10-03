import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import { queryKeys } from '../utils/query-keys';
import type { AdminCreateUserRequest, AdminUpdateUserRequest } from '../types/user';

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: AdminCreateUserRequest) => userService.createUser(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
        },
    });
}

interface UpdateUserVariables {
    userId: string;
    request: AdminUpdateUserRequest;
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, request }: UpdateUserVariables) =>
            userService.updateUser(userId, request),
        onSuccess: (updatedUser) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
            queryClient.invalidateQueries({
                queryKey: queryKeys.users.detail(updatedUser.user_id),
            });
        },
    });
}
