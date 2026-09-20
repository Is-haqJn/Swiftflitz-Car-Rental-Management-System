// useCategories.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService, categoryImageService } from '@/services';
import type {
    CategoryFilters,
    CreateCategoryData,
    UpdateCategoryData,
} from '@/shared/types/category.types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';

/* Query Keys */
export const categoryKeys = {
    all: ['categories'] as const,
    lists: () => [...categoryKeys.all, 'list'] as const,
    list: (filters: CategoryFilters) =>
        [...categoryKeys.lists(), filters] as const,
    details: () => [...categoryKeys.all, 'detail'] as const,
    detail: (id: string) => [...categoryKeys.details(), id] as const,
};

/* Queries */
export function useCategories(filters: CategoryFilters = {}) {
    return useQuery({
        queryKey: categoryKeys.list(filters),
        queryFn: () => categoryService.list(filters),
    });
}

export function useCategory(id: string) {
    return useQuery({
        queryKey: categoryKeys.detail(id),
        queryFn: () => categoryService.get(id),
        enabled: !!id,
    });
}

/* Mutations */
export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCategoryData) => categoryService.create(data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
            toast.success(res.message || 'Category created successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to create category'));
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCategoryData }) =>
            categoryService.update(id, data),
        onSuccess: (res, { id }) => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: categoryKeys.detail(id),
            });
            toast.success(res.message || 'Category updated successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update category'));
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => categoryService.delete(id),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
            toast.success(res.message || 'Category deleted successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to delete category'));
        },
    });
}

/* Image Mutations */
export function useUploadCategoryImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            categoryId,
            file,
            onProgress,
        }: {
            categoryId: string;
            file: File;
            onProgress?: (percentage: number) => void;
        }) => categoryImageService.upload(categoryId, file, onProgress),
        onSuccess: (res, { categoryId }) => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: categoryKeys.detail(categoryId),
            });
            toast.success(res.message || 'Image uploaded successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to upload image'));
        },
    });
}

export function useDeleteCategoryImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (categoryId: string) =>
            categoryImageService.delete(categoryId),
        onSuccess: (res, categoryId) => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: categoryKeys.detail(categoryId),
            });
            toast.success(res.message || 'Image removed successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to remove image'));
        },
    });
}
