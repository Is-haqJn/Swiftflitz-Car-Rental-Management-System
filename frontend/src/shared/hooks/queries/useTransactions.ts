import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEcho } from '@laravel/echo-react';
import { transactionService } from '@/services/transactionService';
import type { TransactionFilters } from '@/shared/types/transaction.types';
import { rentalKeys } from './useRentals';
import { airportBookingKeys } from './useAirportBookings';
import { chauffeurBookingKeys } from './useChauffeurBookings';
import { dashboardKeys } from './useDashboard';

export const transactionKeys = {
    all: ['transactions'] as const,
    list: (filters?: TransactionFilters) =>
        ['transactions', 'list', filters] as const,
    detail: (id: string) => ['transactions', 'detail', id] as const,
    trends: (period: string) => ['transactions', 'trends', period] as const,
};

export function useTransactions(filters?: TransactionFilters) {
    return useQuery({
        queryKey: transactionKeys.list(filters),
        queryFn: () => transactionService.list(filters),
        staleTime: 1000 * 60,
    });
}

export function useTransactionTrends(period: string = '30d') {
    return useQuery({
        queryKey: transactionKeys.trends(period),
        queryFn: () => transactionService.trends(period),
        staleTime: 1000 * 60 * 2,
    });
}

export function useTransaction(id: string) {
    return useQuery({
        queryKey: transactionKeys.detail(id),
        queryFn: () => transactionService.getById(id),
        staleTime: 1000 * 60 * 5,
        enabled: Boolean(id),
    });
}

export function useResolveTransaction(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            action,
            notes,
        }: {
            action: 'approve' | 'reject';
            notes?: string;
        }) => transactionService.resolve(id, action, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
        },
    });
}

/**
 * Listen for PaymentStatusUpdated events on the private admin dashboard channel.
 * Invalidates transactions, rentals, airport/chauffeur bookings, and dashboard
 * stats so all views refresh automatically when a payment is confirmed.
 */
export function usePaymentListener(): void {
    const queryClient = useQueryClient();

    useEcho(
        'dashboard',
        '.PaymentStatusUpdated',
        () => {
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            queryClient.invalidateQueries({ queryKey: rentalKeys.all });
            queryClient.invalidateQueries({ queryKey: airportBookingKeys.all });
            queryClient.invalidateQueries({
                queryKey: chauffeurBookingKeys.all,
            });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
            queryClient.invalidateQueries({
                queryKey: dashboardKeys.revenueTrendAll,
            });
        },
        [queryClient]
    );
}
