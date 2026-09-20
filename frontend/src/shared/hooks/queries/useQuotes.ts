import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { quoteRequestService } from '@/services/rentalService';
import type {
    ConvertQuoteData,
    GenerateQuoteData,
    QuoteRequest,
    QuoteRequestFilters,
} from '@/shared/types/rental.types';
import type { ApiResponse } from '@/shared/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';
import { dashboardKeys } from './useDashboard';
import { rentalKeys } from './useRentals';

/* Query Keys */
export const QUOTE_KEYS = {
    all: ['quote-requests'] as const,
    lists: () => [...QUOTE_KEYS.all, 'list'] as const,
    list: (filters: QuoteRequestFilters) =>
        [...QUOTE_KEYS.lists(), filters] as const,
    details: () => [...QUOTE_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...QUOTE_KEYS.details(), id] as const,
};

/* Queries */
export function useQuoteRequests(filters: QuoteRequestFilters = {}) {
    return useQuery({
        queryKey: QUOTE_KEYS.list(filters),
        queryFn: () => quoteRequestService.list(filters),
        placeholderData: keepPreviousData,
    });
}

export function useQuoteRequest(id: string) {
    return useQuery<ApiResponse<QuoteRequest>>({
        queryKey: QUOTE_KEYS.detail(id),
        queryFn: () => quoteRequestService.get(id),
        enabled: !!id,
    });
}

/* Mutations */
export function useDeleteQuoteRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => quoteRequestService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            toast.success('Quote request deleted.');
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to delete quote request.')
            );
        },
    });
}

export function useMarkContacted() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => quoteRequestService.markContacted(id),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
            queryClient.invalidateQueries({
                queryKey: QUOTE_KEYS.detail(res.data.id),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            toast.success('Marked as contacted.');
        },
        onError: error => {
            toast.error(
                getErrorMessage(error, 'Failed to update quote request.')
            );
        },
    });
}

export function useGenerateQuote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: GenerateQuoteData;
        }) => quoteRequestService.generateQuote(id, payload),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
            queryClient.invalidateQueries({
                queryKey: QUOTE_KEYS.detail(res.data.id),
            });
            toast.success('Quote generated successfully.');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to generate quote.'));
        },
    });
}

export function useSendQuote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => quoteRequestService.sendQuote(id),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
            queryClient.invalidateQueries({
                queryKey: QUOTE_KEYS.detail(res.data.id),
            });
            toast.success('Quote sent to customer.');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to send quote.'));
        },
    });
}

export function useConvertQuote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: ConvertQuoteData;
        }) => quoteRequestService.convert(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.recentActivity,
            });
            toast.success('Quote converted to rental successfully.');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to convert quote.'));
        },
    });
}

export function useResolveConflict(quoteId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (
            action: 'update_and_proceed' | 'merge_and_proceed' | 'reject'
        ) => quoteRequestService.resolveConflict(quoteId, action),
        onSuccess: (_, action) => {
            queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
            queryClient.invalidateQueries({
                queryKey: QUOTE_KEYS.detail(quoteId),
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            if (action !== 'reject') {
                queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
                queryClient.invalidateQueries({
                    queryKey: dashboardKeys.recentActivity,
                });
            }
            if (action === 'reject') {
                toast.success('Quote cancelled.');
            } else {
                toast.success(
                    'Conflict resolved. Rental created successfully.'
                );
            }
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to resolve conflict.'));
        },
    });
}
