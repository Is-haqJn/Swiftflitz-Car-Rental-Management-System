import { apiClient } from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import type {
    ApiResponse,
    SmsTemplate,
    UpdateSmsTemplatePayload,
} from '@/shared/types';

export const smsTemplateService = {
    async getAll(): Promise<ApiResponse<SmsTemplate[]>> {
        return apiClient.get<ApiResponse<SmsTemplate[]>>(
            API_ENDPOINTS.SMS_TEMPLATES.LIST
        );
    },

    async getByKey(key: string): Promise<ApiResponse<SmsTemplate>> {
        return apiClient.get<ApiResponse<SmsTemplate>>(
            API_ENDPOINTS.SMS_TEMPLATES.SHOW(key)
        );
    },

    async update(
        key: string,
        payload: UpdateSmsTemplatePayload
    ): Promise<ApiResponse<SmsTemplate>> {
        return apiClient.put<ApiResponse<SmsTemplate>>(
            API_ENDPOINTS.SMS_TEMPLATES.UPDATE(key),
            payload
        );
    },

    async reset(key: string): Promise<ApiResponse<SmsTemplate>> {
        return apiClient.post<ApiResponse<SmsTemplate>>(
            API_ENDPOINTS.SMS_TEMPLATES.RESET(key),
            {}
        );
    },
};
