import { type AxiosRequestConfig } from 'axios';
import { axiosClient } from '@/shared/api/axiosClient';

export const apiClient = {
    get: async <T>(url: string, request?: AxiosRequestConfig): Promise<T> => {
        const response = await axiosClient.get<T>(url, request);
        return response.data;
    },

    post: async <T>(
        url: string,
        data?: unknown,
        request?: AxiosRequestConfig
    ): Promise<T> => {
        const response = await axiosClient.post<T>(url, data, request);
        return response.data;
    },

    put: async <T>(
        url: string,
        data?: unknown,
        request?: AxiosRequestConfig
    ): Promise<T> => {
        const response = await axiosClient.put<T>(url, data, request);
        return response.data;
    },

    patch: async <T>(
        url: string,
        data?: unknown,
        request?: AxiosRequestConfig
    ): Promise<T> => {
        const response = await axiosClient.patch<T>(url, data, request);
        return response.data;
    },

    delete: async <T>(
        url: string,
        request?: AxiosRequestConfig
    ): Promise<T> => {
        const response = await axiosClient.delete<T>(url, request);
        return response.data;
    },

    upload: async <T>(
        url: string,
        formData: FormData,
        onProgress?: (percent: number) => void,
        request?: AxiosRequestConfig
    ): Promise<T> => {
        const response = await axiosClient.post<T>(url, formData, {
            ...request,
            timeout: 0, // Disable timeout for large file uploads
            onUploadProgress: e => {
                if (onProgress && e.total) {
                    const percentCompleted = Math.round(
                        (e.loaded * 100) / e.total
                    );
                    onProgress(percentCompleted);
                }
            },
        });

        return response.data;
    },
};
