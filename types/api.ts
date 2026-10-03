export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    code?: string;
    timestamp: string;
}

export class ApiError<T = unknown> extends Error {
    status: number;
    code?: string;
    data?: ApiResponse<T>;

    constructor(message: string, status: number, code?: string, data?: ApiResponse<T>) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.data = data;
    }
}