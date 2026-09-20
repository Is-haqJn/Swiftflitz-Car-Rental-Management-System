import { apiClient } from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import type {
    ApiResponse,
    UpdateWhatsAppTemplatePayload,
    WhatsAppTemplate,
} from '@/shared/types';

export const whatsappTemplateService = {
    async getAll(): Promise<ApiResponse<WhatsAppTemplate[]>> {
        return apiClient.get<ApiResponse<WhatsAppTemplate[]>>(
            API_ENDPOINTS.WHATSAPP_TEMPLATES.LIST
        );
    },

    async getByKey(key: string): Promise<ApiResponse<WhatsAppTemplate>> {
        return apiClient.get<ApiResponse<WhatsAppTemplate>>(
            API_ENDPOINTS.WHATSAPP_TEMPLATES.SHOW(key)
        );
    },

    async update(
        key: string,
        payload: UpdateWhatsAppTemplatePayload
    ): Promise<ApiResponse<WhatsAppTemplate>> {
        return apiClient.put<ApiResponse<WhatsAppTemplate>>(
            API_ENDPOINTS.WHATSAPP_TEMPLATES.UPDATE(key),
            payload
        );
    },

    async reset(key: string): Promise<ApiResponse<WhatsAppTemplate>> {
        return apiClient.post<ApiResponse<WhatsAppTemplate>>(
            API_ENDPOINTS.WHATSAPP_TEMPLATES.RESET(key),
            {}
        );
    },
};
