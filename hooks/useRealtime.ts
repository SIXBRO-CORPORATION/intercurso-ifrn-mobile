import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeService } from '@/services/realtime.service';
import { matchService } from '@/services/match.service';
import { openSseConnection } from '@/utils/sse-client';
import { API_BASE_URL } from '@/utils/http-client';
import { queryKeys } from '@/utils/query-keys';
import type { RealtimeConnectionStatus, RealtimeMatchEventPayload } from '@/types/realtime';

const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 15000;

export function useMatchLive(matchId: string | undefined) {
    const queryClient = useQueryClient();
    const [status, setStatus] = useState<RealtimeConnectionStatus>('idle');

    useEffect(() => {
        if (!matchId) {
            setStatus('idle');
            return;
        }

        let mounted = true;
        let attempt = 0;
        let closeConnection: (() => void) | null = null;
        let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

        const reconcile = async () => {
            try {
                await queryClient.fetchQuery({
                    queryKey: queryKeys.matches.detail(matchId),
                    queryFn: ({ signal }) => matchService.getMatchState(matchId, signal),
                });
            } catch (error) {
                console.error('Falha ao reconciliar estado da partida:', error);
            }
        };

        const scheduleReconnect = () => {
            if (!mounted) return;
            setStatus('reconnecting');
            const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** attempt, RECONNECT_MAX_DELAY_MS);
            attempt += 1;
            reconnectTimeout = setTimeout(connect, delay);
        };

        const connect = async () => {
            if (!mounted) return;
            setStatus(attempt === 0 ? 'connecting' : 'reconnecting');

            await reconcile();
            if (!mounted) return;

            try {
                const { ticket } = await realtimeService.issueTicket('match', matchId);
                if (!mounted) return;

                const url = `${API_BASE_URL}/match/${matchId}/live?ticket=${encodeURIComponent(ticket)}`;

                closeConnection = openSseConnection(url, {
                    onOpen: () => {
                        if (!mounted) return;
                        attempt = 0;
                        setStatus('open');
                    },
                    onEvent: (event) => {
                        if (!mounted) return;
                        try {
                            const payload: RealtimeMatchEventPayload = JSON.parse(event.data);
                            if (payload.match) {
                                queryClient.setQueryData(queryKeys.matches.detail(matchId), payload.match);
                            }
                            if (payload.event === 'match_finished') {
                                queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
                            }
                        } catch (error) {
                            console.error('Falha ao processar evento em tempo real:', error);
                        }
                    },
                    onError: () => scheduleReconnect(),
                    onClose: () => scheduleReconnect(),
                });
            } catch (error) {
                console.error('Falha ao abrir conexão em tempo real:', error);
                scheduleReconnect();
            }
        };

        connect();

        return () => {
            mounted = false;
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
            closeConnection?.();
        };
    }, [matchId, queryClient]);

    return { status };
}

export function useSeasonLive(seasonId: string | undefined) {
    const queryClient = useQueryClient();
    const [status, setStatus] = useState<RealtimeConnectionStatus>('idle');

    useEffect(() => {
        if (!seasonId) {
            setStatus('idle');
            return;
        }

        let mounted = true;
        let attempt = 0;
        let closeConnection: (() => void) | null = null;
        let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

        const reconcile = () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
        };

        const scheduleReconnect = () => {
            if (!mounted) return;
            setStatus('reconnecting');
            const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** attempt, RECONNECT_MAX_DELAY_MS);
            attempt += 1;
            reconnectTimeout = setTimeout(connect, delay);
        };

        const connect = async () => {
            if (!mounted) return;
            setStatus(attempt === 0 ? 'connecting' : 'reconnecting');

            reconcile();

            try {
                const { ticket } = await realtimeService.issueTicket('season', seasonId);
                if (!mounted) return;

                const url = `${API_BASE_URL}/season/${seasonId}/live?ticket=${encodeURIComponent(ticket)}`;

                closeConnection = openSseConnection(url, {
                    onOpen: () => {
                        if (!mounted) return;
                        attempt = 0;
                        setStatus('open');
                    },
                    onEvent: (event) => {
                        if (!mounted) return;
                        try {
                            const payload: RealtimeMatchEventPayload = JSON.parse(event.data);
                            if (payload.match) {
                                queryClient.setQueryData(
                                    queryKeys.matches.detail(payload.match_id),
                                    payload.match
                                );
                            }
                            if (payload.event === 'match_finished') {
                                queryClient.invalidateQueries({ queryKey: queryKeys.brackets.all });
                            }
                        } catch (error) {
                            console.error('Falha ao processar evento em tempo real:', error);
                        }
                    },
                    onError: () => scheduleReconnect(),
                    onClose: () => scheduleReconnect(),
                });
            } catch (error) {
                console.error('Falha ao abrir conexão em tempo real:', error);
                scheduleReconnect();
            }
        };

        connect();

        return () => {
            mounted = false;
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
            closeConnection?.();
        };
    }, [seasonId, queryClient]);

    return { status };
}
