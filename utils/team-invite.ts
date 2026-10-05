import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';

const storageKey = (teamId: string) => `team-invite.${teamId}`;

export const inviteStore = {
    async save(teamId: string, token: string): Promise<void> {
        try {
            await SecureStore.setItemAsync(storageKey(teamId), token);
        } catch {
            // Sem armazenamento seguro o convite só aparece na tela de criação.
        }
    },

    async get(teamId: string): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(storageKey(teamId));
        } catch {
            return null;
        }
    },

    async remove(teamId: string): Promise<void> {
        try {
            await SecureStore.deleteItemAsync(storageKey(teamId));
        } catch {
            // Nada a limpar.
        }
    },
};

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
