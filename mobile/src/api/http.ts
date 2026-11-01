import axios, { AxiosError } from 'axios';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api';

export type FieldError = { field: string; message: string };
export type ApiError = { code: string; message: string; fieldErrors: FieldError[] };

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Chamado pelo AuthProvider (Marco 1) para injetar o token e tratar 401. */
export function configureAuth(token: string | null, handler?: () => void) {
  accessToken = token;
  if (handler) onUnauthorized = handler;
}

export const http = axios.create({ baseURL: API_URL, timeout: 10000 });

http.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401 && accessToken) onUnauthorized?.();
    return Promise.reject(error);
  },
);

/** Converte qualquer erro em ApiError com mensagem clara para exibir ao usuário. */
export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError<ApiError>(error)) {
    if (error.response?.data?.message) {
      const { code, message, fieldErrors } = error.response.data;
      return { code, message, fieldErrors: fieldErrors ?? [] };
    }
    if (!error.response) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
        fieldErrors: [],
      };
    }
  }
  return { code: 'UNKNOWN', message: 'Ocorreu um erro inesperado.', fieldErrors: [] };
}
