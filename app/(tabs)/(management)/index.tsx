import { ScreenPlaceholder } from '@/components/screen-placeholder';
import { useAuth } from '@/hooks/useAuth';

export default function ManagementScreen() {
    const { user } = useAuth();
    const canManage = user?.role === 'MONITOR' || user?.role === 'ADMIN';


    if (!canManage) {
        return (
            <ScreenPlaceholder
                title="Acesso restrito"
                description="Esta área é exclusiva para monitores e administradores."
            />
        );
    }

    return (
        <ScreenPlaceholder
            title="Gestão"
            description="Pendências de equipes, doações, partidas e denúncias vão aparecer aqui."
        />
    );
}
