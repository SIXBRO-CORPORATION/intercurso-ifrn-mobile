import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { authService } from '../services/auth.service';
import type { User } from '../types/user';

interface AuthContextData {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitializing: boolean;
    loginWithSuap: () => Promise<void>;
    logout: () => Promise<void>;
    refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    const fetchUser = useCallback(async () => {
        if (!authService.isAuthenticated()) {
            setUser(null);
            return;
        }

        try {
            const userData = await authService.getMe();
            setUser(userData);
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
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
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
            await SplashScreen.hideAsync();
        })();
    }, [fetchUser]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                isInitializing,
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
