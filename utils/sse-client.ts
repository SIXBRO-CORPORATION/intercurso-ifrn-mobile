import { fetch } from 'expo/fetch';

export interface SseEvent {
    event: string;
    data: string;
}

interface SseConnectionOptions {
    onOpen?: () => void;
    onEvent: (event: SseEvent) => void;
    onError?: (error: unknown) => void;
    onClose?: () => void;
}

function parseSseFrame(rawFrame: string): SseEvent | null {
    let eventType = 'message';
    const dataLines: string[] = [];

    for (const line of rawFrame.split('\n')) {
        if (line.startsWith(':') || line.length === 0) {
            continue;
        }
        if (line.startsWith('event:')) {
            eventType = line.slice('event:'.length).trim();
        } else if (line.startsWith('data:')) {
            dataLines.push(line.slice('data:'.length).trim());
        }
    }

    if (dataLines.length === 0) {
        return null;
    }

    return { event: eventType, data: dataLines.join('\n') };
}

export function openSseConnection(url: string, options: SseConnectionOptions): () => void {
    const controller = new AbortController();
    let closed = false;

    (async () => {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { Accept: 'text/event-stream' },
                signal: controller.signal,
            });

            if (!response.ok || !response.body) {
                throw new Error(`Não foi possível abrir o canal em tempo real (status ${response.status})`);
            }

            if (closed) {
                return;
            }

            options.onOpen?.();

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (!closed) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }

                buffer += decoder.decode(value, { stream: true });

                let separatorIndex: number;
                while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
                    const rawFrame = buffer.slice(0, separatorIndex);
                    buffer = buffer.slice(separatorIndex + 2);

                    const event = parseSseFrame(rawFrame);
                    if (event) {
                        options.onEvent(event);
                    }
                }
            }

            if (!closed) {
                options.onClose?.();
            }
        } catch (error) {
            if (!closed && !controller.signal.aborted) {
                options.onError?.(error);
            }
        }
    })();

    return () => {
        closed = true;
        controller.abort();
    };
}
