import React, { createContext, useContext, useCallback, useEffect, useMemo } from 'react';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/overlays/toast';
import { setToastCallback } from '@/utils/http-client';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextData {
    showToast: (message: string, type: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const showToast = useCallback((message: string, type: ToastType) => {
        Toast.show({
            type: type,
            text1: type === 'success' ? 'Sucesso' : type === 'error' ? 'Erro' : 'Informação',
            text2: message,
            position: 'top',
            visibilityTime: 4000,
            autoHide: true,
            topOffset: 60,
        });
    }, []);

    const success = useCallback(
        (message: string) => {
            showToast(message, 'success');
        },
        [showToast]
    );

    const error = useCallback(
        (message: string) => {
            showToast(message, 'error');
        },
        [showToast]
    );

    const info = useCallback(
        (message: string) => {
            showToast(message, 'info');
        },
        [showToast]
    );

    useEffect(() => {
        setToastCallback((message: string, type: 'success' | 'error') => {
            showToast(message, type);
        });
    }, [showToast]);

    const contextValue = useMemo(
        () => ({ showToast, success, error, info }),
        [showToast, success, error, info]
    );

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <Toast config={toastConfig} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    return context;
}