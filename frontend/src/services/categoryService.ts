// categoryService.ts
import { apiClient } from '@/shared/api/apiClient';
import type { ApiResponse } from '@/shared/types';
import type {
    Category,
    CategoryFilters,
    CreateCategoryData,
    UpdateCategoryData,
} from '@/shared/types/category.types';
import type { PaginatedResponse } from '@/shared/types';

/* Category CRUD */
export const categoryService = {
    // The ApiResponse trait wraps paginated data as:
    // { status, message, data: { data: [...], meta: {...} } }
    // We remap it to match PaginatedResponse: { data: [...], meta: {...} }
    async list(
        filters: CategoryFilters = {}
    ): Promise<PaginatedResponse<Category>> {
        const response = await apiClient.get<PaginatedResponse<Category>>(
            '/categories',
            { params: filters }
        );

        return response;
    },

    async get(id: string): Promise<ApiResponse<Category>> {
        const response = await apiClient.get<ApiResponse<Category>>(
            `/categories/${id}`
        );

        return response;
    },

    async create(data: CreateCategoryData): Promise<ApiResponse<Category>> {
        const response = await apiClient.post<ApiResponse<Category>>(
            '/categories',
            data
        );

        return response;
    },

    async update(
        id: string,
        data: UpdateCategoryData
    ): Promise<ApiResponse<Category>> {
        const response = await apiClient.put<ApiResponse<Category>>(
            `/categories/${id}`,
            data
        );

        return response;
    },

    async delete(id: string): Promise<{ status: string; message: string }> {
        const response = await apiClient.delete<{
            status: string;
            message: string;
        }>(`/categories/${id}`);
        return response;
    },
};

/* Category Image */
export const categoryImageService = {
    async upload(
        categoryId: string,
        file: File,
        onProgress?: (percentage: number) => void
    ): Promise<ApiResponse<Category>> {
        const formData = new FormData();
        formData.append('image', file);

        const response = apiClient.upload<ApiResponse<Category>>(
            `/categories/${categoryId}/image`,
            formData,
            onProgress
        );

        return response;
    },

    async delete(
        categoryId: string
    ): Promise<{ status: string; message: string }> {
        const response = await apiClient.delete<{
            status: string;
            message: string;
        }>(`/categories/${categoryId}/image`);
        return response;
    },
};
