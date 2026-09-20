// useCustomers.ts
import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import {
    customerService,
    customerDocumentService,
    type DocumentCollection,
} from '@/services/customerService';
import type { CreateCustomerData, UpdateCustomerData } from '@/shared/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';
import type { GenericFilters } from '@/shared/types';
import { dashboardKeys } from './useDashboard';
import { rentalKeys } from './useRentals';

/* Query Keys */
export const customerKeys = {
    all: ['customers'] as const,
    lists: () => [...customerKeys.all, 'list'] as const,
    list: (filters: GenericFilters) =>
        [...customerKeys.lists(), filters] as const,
    details: () => [...customerKeys.all, 'detail'] as const,
    detail: (id: string) => [...customerKeys.details(), id] as const,
};

/* Queries */
export function useCustomers(filters: GenericFilters = {}) {
    return useQuery({
        queryKey: customerKeys.list(filters),
        queryFn: () => customerService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useCustomer(id: string) {
    return useQuery({
        queryKey: customerKeys.detail(id),
        queryFn: () => customerService.get(id),
        enabled: !!id,
    });
}

/* Mutations */
export function useCreateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCustomerData) => customerService.create(data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            toast.success(res.message || 'Customer created successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to create customer'));
        },
    });
}

export function useUpdateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: UpdateCustomerData;
        }) => customerService.update(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
            queryClient.invalidateQueries({ queryKey: customerKeys.details() });
            toast.success(res.message || 'Customer updated successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update customer'));
        },
    });
}

export function useDeleteCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => customerService.delete(id),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            toast.success(res.message || 'Customer deleted successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to delete customer'));
        },
    });
}

export function useToggleBlacklist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            customerService.toggleBlacklist(id, reason),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
            queryClient.invalidateQueries({ queryKey: customerKeys.details() });
            toast.success(res.message || 'Blacklist status updated');
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update blacklist status')
            );
        },
    });
}

/* Document Mutations */
export function useUploadCustomerDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            customerId,
            collection,
            file,
        }: {
            customerId: string;
            collection: DocumentCollection; // 'license' | 'id_document' | 'documents'
            file: File;
        }) => customerDocumentService.upload(customerId, collection, file),
        onSuccess: (res, variables) => {
            queryClient.invalidateQueries({
                queryKey: customerKeys.detail(variables.customerId),
            });
            toast.success(res.message || 'Document uploaded successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to upload document'));
        },
    });
}

export function useVerifyCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => customerService.verify(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({
                queryKey: customerKeys.detail(id),
            });
            queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
            queryClient.invalidateQueries({ queryKey: rentalKeys.all });
            toast.success('Customer profile verified.');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to verify customer.'));
        },
    });
}

export function useRequestReupload() {
    return useMutation({
        mutationFn: (id: string) => customerService.requestReupload(id),
        onSuccess: res => {
            toast.success(res.message || 'Document reupload request sent.');
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to send reupload request.')
            );
        },
    });
}

export function useSendCompleteProfileLink() {
    return useMutation({
        mutationFn: (id: string) => customerService.sendCompleteProfileLink(id),
        onSuccess: res => {
            toast.success(res.message || 'Profile completion link sent.');
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to send profile completion link.')
            );
        },
    });
}

export function useDeleteCustomerDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            customerId,
            documentId,
        }: {
            customerId: string;
            documentId: number;
        }) => customerDocumentService.delete(customerId, documentId),
        onSuccess: (res, variables) => {
            queryClient.invalidateQueries({
                queryKey: customerKeys.detail(variables.customerId),
            });
            toast.success(res.message || 'Document deleted successfully');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to delete document'));
        },
    });
}
