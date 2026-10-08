import { httpClient } from '@/utils/http-client';
import type { LiveChannelType, LiveTicketResponse } from '@/types/realtime';

const BASE_PATH = '/realtime';

function unwrap<T>(data: T | undefined, message: string): T {
    if (data === undefined) {
        throw new Error(message);
    }
    return data;
}

class RealtimeService {
    async issueTicket(channelType: LiveChannelType, channelId: string): Promise<LiveTicketResponse> {
        const response = await httpClient.post<LiveTicketResponse>(
            `${BASE_PATH}/ticket`,
            { channel_type: channelType, channel_id: channelId },

            { skipToast: true }
        );

        return unwrap(response.data, 'O backend não retornou o ticket de conexão em tempo real');
    }
}

export const realtimeService = new RealtimeService();
