import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking } from 'react-native';
import { pushNotificationService } from '@/services/notification.service';
import { useToast } from '@/providers/ToastProvider';

export function usePushNotificationsSetting() {
    const toast = useToast();
    const [enabled, setEnabled] = useState(false);
    const [isPending, setIsPending] = useState(true);
    const wasActive = useRef(false);

    const refresh = useCallback(async () => {
        try {
            const active = await pushNotificationService.isActive();
            setEnabled(active);

            if (active && !wasActive.current) {
                pushNotificationService.sync().catch((error) => {
                    console.warn('[push-notification] Falha ao sincronizar as notificações:', error);
                });
            }
            wasActive.current = active;
        } catch (error) {
            console.warn('[push-notification] Falha ao ler o estado das notificações:', error);
        } finally {
            setIsPending(false);
        }
    }, []);

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
                    wasActive.current = granted;
                    if (!granted) {
                        setEnabled(false);
                        promptOpenSettings();
                    }
                } else {
                    wasActive.current = false;
                    await pushNotificationService.disable();
                }
            } catch (error) {
                console.warn('[push-notification] Falha ao alterar as notificações:', error);

                if (next) {
                    wasActive.current = false;
                    setEnabled(false);
                    toast.error('Não foi possível ativar as notificações. Tente novamente.');
                } else {
                    toast.info(
                        'Notificações desativadas neste aparelho. Vamos concluir a atualização no servidor assim que possível.'
                    );
                }
            } finally {
                setIsPending(false);
            }
        },
        [isPending, promptOpenSettings, toast]
    );

    return { enabled, isPending, setNotificationsEnabled };
}
