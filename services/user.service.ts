import { httpClient } from '../utils/http-client';
import type { AdminCreateUserRequest, AdminUpdateUserRequest, User } from '../types/user';

const BASE_PATH = '/user';

class UserService {
    /** POST /api/user/ — requer papel ADMIN. */
    async createUser(request: AdminCreateUserRequest): Promise<User> {
        const response = await httpClient.post<User>(`${BASE_PATH}/`, request);

        if (!response.data) {
            throw new Error('O backend não retornou os dados do usuário criado');
        }

        return response.data;
    }

    /** PATCH /api/user/{user_id} — requer papel ADMIN. */
    async updateUser(userId: string, request: AdminUpdateUserRequest): Promise<User> {
        const response = await httpClient.patch<User>(`${BASE_PATH}/${userId}`, request);

        if (!response.data) {
            throw new Error('O backend não retornou os dados do usuário atualizado');
        }

        return response.data;
    }
}

export const userService = new UserService();
