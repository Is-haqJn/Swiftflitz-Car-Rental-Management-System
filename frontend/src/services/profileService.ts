import { apiClient } from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import type { ApiResponse, AuthUserState } from '@/shared/types';

export interface UpdateProfileData {
    name?: string;
    email?: string;
    username?: string;
    phone?: string;
    profile_photo_url?: string;
}

export interface ChangePasswordData {
    current_password: string;
    password: string;
    password_confirmation: string;
}

export interface SessionToken {
    id: string;
    name: string;
    created_at: string;
    last_used_at: string | null;
    expires_at: string | null;
}

export interface AdminSessionToken extends SessionToken {
    tokenable?: {
        id: string | number;
        name: string;
        email: string;
    } | null;
}

export const profileService = {
    async get(): Promise<ApiResponse<AuthUserState>> {
        return apiClient.get<ApiResponse<AuthUserState>>(
            API_ENDPOINTS.PROFILE.BASE
        );
    },

    async update(data: UpdateProfileData): Promise<ApiResponse<AuthUserState>> {
        return apiClient.patch<ApiResponse<AuthUserState>>(
            API_ENDPOINTS.PROFILE.BASE,
            data
        );
    },

    async changePassword(
        data: ChangePasswordData
    ): Promise<{ status: string; message: string }> {
        return apiClient.patch<{ status: string; message: string }>(
            API_ENDPOINTS.PROFILE.PASSWORD,
            data
        );
    },

    async uploadPhoto(
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<ApiResponse<AuthUserState>> {
        const formData = new FormData();
        formData.append('photo', file);

        return apiClient.upload<ApiResponse<AuthUserState>>(
            API_ENDPOINTS.PROFILE.PHOTO,
            formData,
            onProgress
        );
    },

    async removePhoto(): Promise<ApiResponse<AuthUserState>> {
        return apiClient.delete<ApiResponse<AuthUserState>>(
            API_ENDPOINTS.PROFILE.REMOVE_PHOTO
        );
    },

    async getSessions(): Promise<ApiResponse<SessionToken[]>> {
        return apiClient.get<ApiResponse<SessionToken[]>>(
            API_ENDPOINTS.PROFILE.SESSIONS
        );
    },

    async revokeSession(tokenId: string): Promise<void> {
        return apiClient.delete<void>(
            API_ENDPOINTS.PROFILE.REVOKE_SESSION(tokenId)
        );
    },
};
