export interface AuthCallbackParams {
    token?: string;
    refresh_token?: string;
    error?: string;
    [key: string]: string | undefined;
}

export class AuthCancelledError extends Error {
    constructor(message = 'Login cancelado pelo usuário') {
        super(message);
        this.name = 'AuthCancelledError';
    }
}
