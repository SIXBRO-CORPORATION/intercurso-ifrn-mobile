import * as Linking from 'expo-linking';

export function buildInviteLink(token: string): string {
    return Linking.createURL(`join/${token}`);
}

export function extractInviteToken(input: string): string | null {
    const text = input.trim();
    if (!text) return null;

    const fromLink = text.match(/join\/([^/?#\s]+)/i);
    if (fromLink) {
        try {
            return decodeURIComponent(fromLink[1]);
        } catch {
            return fromLink[1];
        }
    }

    return /^[A-Za-z0-9-]{8,}$/.test(text) ? text : null;
}
