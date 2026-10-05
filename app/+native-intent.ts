const AUTH_CALLBACK = /^(?:[a-z][a-z0-9+.-]*:\/\/)?\/*callback(?:[/?#]|$)/i;

export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }): string | null {
    try {
        if (AUTH_CALLBACK.test(path)) {
            return initial ? '/' : null;
        }
    } catch {
        // Em caso de erro, segue o comportamento padrão do roteador.
    }

    return path;
}
