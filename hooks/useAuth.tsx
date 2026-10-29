import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { pushNotificationService } from '@/services/notification.service';
import type { User } from '@/types/user';

async function syncPushTokenWithBackend() {
    try {
        const granted = await pushNotificationService.requestPermission();
        if (!granted) return;

        await pushNotificationService.registerDeviceToken();
    } catch (error) {
        console.warn('[push-notification] Falha ao registrar o device token:', error);
    }
}

interface AuthContextData {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitializing: boolean;
    hasEnteredAsVisitor: boolean;
    continueAsVisitor: () => void;
    loginWithSuap: () => Promise<void>;
    logout: () => Promise<void>;
    refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [hasEnteredAsVisitor, setHasEnteredAsVisitor] = useState(false);

    const continueAsVisitor = useCallback(() => {
        setHasEnteredAsVisitor(true);
    }, []);

    const fetchUser = useCallback(async () => {
        if (!(await authService.isAuthenticated())) {
            setUser(null);
            return;
        }

        try {
            const userData = await authService.getMe();
            setUser(userData);
            void syncPushTokenWithBackend();
        } catch (error) {
            console.error('Falha ao buscar usuário autenticado:', error);
            setUser(null);
            await authService.logout();
        }
    }, []);

    const loginWithSuap = useCallback(async () => {
        setIsLoading(true);
        try {
            const userData = await authService.loginWithSuap();
            setUser(userData);
            void syncPushTokenWithBackend();
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            try {
                await pushNotificationService.removeDeviceToken();
            } catch (error) {
                console.warn('[push-notification] Falha ao remover o device token:', error);
            }
            await authService.logout();
        } finally {
            setUser(null);
            setIsLoading(false);
        }
    }, []);

    const refetch = useCallback(async () => {
        await fetchUser();
    }, [fetchUser]);

    useEffect(() => {
        (async () => {
            await fetchUser();
            setIsInitializing(false);
        })();
    }, [fetchUser]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                isInitializing,
                hasEnteredAsVisitor,
                continueAsVisitor,
                loginWithSuap,
                logout,
                refetch,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}