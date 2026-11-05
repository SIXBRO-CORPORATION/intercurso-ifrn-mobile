import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Linking } from 'react-native';
import { pushNotificationService } from '@/services/notification.service';
import { useToast } from '@/providers/ToastProvider';

export function usePushNotificationsSetting() {
    const toast = useToast();
    const [enabled, setEnabled] = useState(false);
    const [isPending, setIsPending] = useState(true);

    const refresh = useCallback(async () => {
        try {
            setEnabled(await pushNotificationService.isActive());
        } catch (error) {
            console.warn('[push-notification] Falha ao ler o estado das notificações:', error);
        } finally {
            setIsPending(false);
        }
    }, []);

    // Relê ao abrir a tela e ao voltar das configurações do sistema, onde
    // o usuário pode ter liberado ou bloqueado a permissão.
    useEffect(() => {
        void refresh();

        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') void refresh();
        });

        return () => subscription.remove();
    }, [refresh]);

    const promptOpenSettings = useCallback(() => {
        Alert.alert(
            'Notificações bloqueadas',
            'Para receber avisos de jogos e da temporada, libere as notificações do Intercurso nas configurações do aparelho.',
            [
                { text: 'Agora não', style: 'cancel' },
                { text: 'Abrir configurações', onPress: () => void Linking.openSettings() },
            ]
        );
    }, []);

    const setNotificationsEnabled = useCallback(
        async (next: boolean) => {
            if (isPending) return;

            setIsPending(true);
            setEnabled(next);

            try {
                if (next) {
                    const granted = await pushNotificationService.enable();
                    if (!granted) {
                        setEnabled(false);
                        promptOpenSettings();
                    }
                } else {
                    await pushNotificationService.disable();
                }
            } catch (error) {
                console.warn('[push-notification] Falha ao alterar as notificações:', error);
                setEnabled(!next);
                toast.error(
                    next
                        ? 'Não foi possível ativar as notificações. Tente novamente.'
                        : 'Não foi possível desativar as notificações. Tente novamente.'
                );
            } finally {
                setIsPending(false);
            }
        },
        [isPending, promptOpenSettings, toast]
    );

    return { enabled, isPending, setNotificationsEnabled };
}
