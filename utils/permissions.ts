import type { User } from '../types/user';
import type { UserRole } from '../types/enums';

export function hasRole(user: User | null | undefined, role: UserRole): boolean {
    if (!user) {
        return false;
    }

    if (user.role === 'ADMIN') {
        return true;
    }

    return user.role === role;
}

export function hasAnyRole(user: User | null | undefined, roles: UserRole[]): boolean {
    return roles.some((role) => hasRole(user, role));
}

export function isAdmin(user: User | null | undefined): boolean {
    return user?.role === 'ADMIN';
}

export function isMonitorOrAbove(user: User | null | undefined): boolean {
    return hasRole(user, 'MONITOR');
}

export function isAthlete(user: User | null | undefined): boolean {
    return !!user?.atleta;
}

export function isActiveUser(user: User | null | undefined): boolean {
    return !!user?.active;
}
