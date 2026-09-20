import { apiClient } from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import type {
    ApiResponse,
    EmailTemplate,
    UpdateEmailTemplatePayload,
} from '@/shared/types';

export const emailTemplateService = {
    /**
     * List all email templates.
     */
    async getAll(): Promise<ApiResponse<EmailTemplate[]>> {
        return apiClient.get<ApiResponse<EmailTemplate[]>>(
            API_ENDPOINTS.EMAIL_TEMPLATES.LIST
        );
    },

    /**
     * Get a single email template by key.
     */
    async getByKey(key: string): Promise<ApiResponse<EmailTemplate>> {
        return apiClient.get<ApiResponse<EmailTemplate>>(
            API_ENDPOINTS.EMAIL_TEMPLATES.SHOW(key)
        );
    },

    /**
     * Update subject and html_content for an email template.
     */
    async update(
        key: string,
        payload: UpdateEmailTemplatePayload
    ): Promise<ApiResponse<EmailTemplate>> {
        return apiClient.put<ApiResponse<EmailTemplate>>(
            API_ENDPOINTS.EMAIL_TEMPLATES.UPDATE(key),
            payload
        );
    },

    /**
     * Reset an email template back to its default content.
     */
    async reset(key: string): Promise<ApiResponse<EmailTemplate>> {
        return apiClient.post<ApiResponse<EmailTemplate>>(
            API_ENDPOINTS.EMAIL_TEMPLATES.RESET(key),
            {}
        );
    },
};
