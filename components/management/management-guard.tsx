import type { ReactNode } from 'react';
import { EmptyState, LoadingState } from '@/components/states/screen-states';
import { useAuth } from '@/hooks/useAuth';
import { isMonitorOrAbove } from '@/utils/permissions';

export function ManagementGuard({ children }: { children: ReactNode }) {
    const { user, isInitializing } = useAuth();

    if (isInitializing) {
        return <LoadingState label="Carregando…" />;
    }

    if (!isMonitorOrAbove(user)) {
        return (
            <EmptyState
                title="Acesso restrito"
                description="Esta área é exclusiva para monitores e administradores."
            />
        );
    }

    return <>{children}</>;
}
