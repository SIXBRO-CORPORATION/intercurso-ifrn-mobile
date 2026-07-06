export type UserRole = 'USER' | 'MONITOR' | 'ADMIN' | string;

export interface User {
    user_id: string;
    name: string;
    email: string | null;
    matricula: number;
    role: UserRole;
    atleta: boolean;
    active: boolean;
}
