import type { Gender, UserRole } from './enums';

export type { UserRole };

export interface User {
    user_id: string;
    name: string;
    email: string | null;
    matricula: string;
    role: UserRole;
    atleta: boolean;
    active: boolean;
    gender?: Gender | null;
    curso?: string | null;
    campus?: string | null;
}

export interface AdminCreateUserRequest {
    name: string;
    email?: string;
    cpf: string;
    matricula: string;
    role: Extract<UserRole, 'MONITOR' | 'ADMIN'>;
}

export interface AdminUpdateUserRequest {
    name?: string;
    email?: string;
    role?: UserRole;
    atleta?: boolean;
    active?: boolean;
}
