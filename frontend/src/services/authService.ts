import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { tokenManager } from '@/shared/config/tokenManager';
import { apiClient } from '@/shared/api/apiClient';
import { LoginResponseSchema } from '@/shared/libs/schemas/auth.schemas';
import type {
    ApiResponse,
    AuthResponse,
    AuthUserState,
    ForgotPasswordData,
    LoginCredentials,
    RegisterData,
    ResetPasswordData,
} from '@/shared/types';
import store from '@/store';
import axios from 'axios';

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        //? attempt login
        const response = await apiClient.post<AuthResponse>(
            API_ENDPOINTS.AUTH.LOGIN,
            credentials
        );

        const validation = LoginResponseSchema.safeParse(response);
        if (!validation.success) {
            console.warn(
                '[authService] Login response schema mismatch:',
                validation.error.issues
            );
        }

        if (tokenManager.isTokenMode() && response?.token) {
            tokenManager.setToken(response.token);
            const expiresAt = response.data?.expires_at;
            if (expiresAt) {
                localStorage.setItem(
                    'auth_token_expires_at',
                    new Date(expiresAt).getTime().toString()
                );
            }
        }

        return response;
    },

    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>(
            API_ENDPOINTS.AUTH.REGISTER,
            data
        );

        if (tokenManager.isTokenMode() && response?.token) {
            tokenManager.setToken(response.token);
        }

        return response;
    },

    async logout(): Promise<void> {
        try {
            await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
        } finally {
            if (tokenManager.isTokenMode()) {
                tokenManager.removeToken();
                localStorage.removeItem('auth_token_expires_at');
            }
        }
    },

    async getCurrentUser(): Promise<ApiResponse<AuthUserState>> {
        const response = await apiClient.get<ApiResponse<AuthUserState>>(
            API_ENDPOINTS.AUTH.ME
        );
        return response;
    },

    async forgetPassword(
        data: ForgotPasswordData
    ): Promise<{ status: string; message: string }> {
        const response = await apiClient.post<{
            status: string;
            message: string;
        }>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
        return response;
    },

    async resetPassword(
        data: ResetPasswordData
    ): Promise<{ status: string; message: string }> {
        const response = await apiClient.post<{
            status: string;
            message: string;
        }>(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
        return response;
    },

    async getCsrfCookie(): Promise<void> {
        await axios.get(
            `${import.meta.env.VITE_BASE_URL}${API_ENDPOINTS.AUTH.CSRF_TOKEN}`,
            {
                withCredentials: true,
            }
        );
    },

    /**
     * Check if the user might be authenticated
     * Redux state might be lost on page refresh,
     * but if token exists in localStorage,
     * we can assume user is authenticated and try to fetch user
     * So we can just check the redux store directly
     */
    isAuthenticated(): boolean {
        //? check if token mode and token exists
        if (tokenManager.isTokenMode()) {
            //* if token and user data exists in store, then we can assume user is authenticated
            return (
                !!tokenManager.getToken() &&
                store.getState().auth.isAuthenticated
            );
        }

        //? if cookie mode, we can only rely on store state
        return store.getState().auth.isAuthenticated;
    },

    removeBaseApiPrefix: (string: string) => {
        // remove api/v1 from base url to get correct endpoint for CSRF cookie
        return string.replace(/\/?api\/?v?\d*\/?/, '');
    },
};
