import { API_BASE_URL } from '@/utils/http-client';

const API_ORIGIN = API_BASE_URL.match(/^https?:\/\/[^/]+/)?.[0] ?? '';

export function resolveDocumentUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;

    return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function documentFormatLabel(url: string): 'PDF' | 'DOCX' | null {
    const extension = url.split(/[?#]/)[0].match(/\.(pdf|docx)$/i)?.[1]?.toUpperCase();

    return extension === 'PDF' || extension === 'DOCX' ? extension : null;
}
