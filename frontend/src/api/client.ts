export class ApiError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ConflictApiError extends ApiError {
  constructor(message: string) {
    super(message, 409);
    this.name = 'ConflictApiError';
  }
}
const rawApiUrl = (import.meta as any).env?.VITE_API_URL;
const BASE_URL = rawApiUrl ? `${rawApiUrl.replace(/\/$/, '')}/api` : '/api';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit & { idempotencyKey?: string } = {}
): Promise<T> {
  const token = localStorage.getItem('newtonite_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error?.message || data?.message || 'Request failed';
    if (response.status === 409) {
      throw new ConflictApiError(message);
    }
    throw new ApiError(message, response.status, data?.error?.details);
  }

  return data;
}
