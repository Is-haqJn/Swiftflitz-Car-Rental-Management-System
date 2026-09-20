import { apiClient } from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import type {
    ApiResponse,
    ExportRecord,
    QueueExportPayload,
} from '@/shared/types';

export const exportService = {
    async list(): Promise<ApiResponse<ExportRecord[]>> {
        return apiClient.get<ApiResponse<ExportRecord[]>>(
            API_ENDPOINTS.EXPORTS.BASE
        );
    },

    async queue(
        payload: QueueExportPayload
    ): Promise<ApiResponse<ExportRecord>> {
        return apiClient.post<ApiResponse<ExportRecord>>(
            API_ENDPOINTS.EXPORTS.QUEUE,
            payload
        );
    },

    /**
     * Download an export file with the Bearer token attached.
     * Returns a temporary object URL suitable for programmatic download.
     * The caller is responsible for calling URL.revokeObjectURL() after use.
     */
    async download(id: string): Promise<string> {
        const blob = await apiClient.get<Blob>(
            API_ENDPOINTS.EXPORTS.DOWNLOAD(id),
            {
                responseType: 'blob',
            } as never
        );
        // Force octet-stream so all browsers treat the response as a download, not inline.
        const downloadBlob = new Blob([blob], {
            type: 'application/octet-stream',
        });
        return URL.createObjectURL(downloadBlob);
    },

    async delete(id: string): Promise<ApiResponse<null>> {
        return apiClient.delete<ApiResponse<null>>(
            API_ENDPOINTS.EXPORTS.DELETE(id)
        );
    },
};
