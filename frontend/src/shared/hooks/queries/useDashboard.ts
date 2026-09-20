import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEcho } from '@laravel/echo-react';
import { dashboardService } from '@/services/dashboardService';

/* Query Keys */
export const dashboardKeys = {
    all: ['dashboard'] as const,
    stats: (branchId?: string | null) =>
        ['dashboard', 'stats', branchId ?? 'global'] as const,
    statsAll: ['dashboard', 'stats'] as const,
    revenueTrend: (period?: string, branchId?: string | null) =>
        ['dashboard', 'revenue-trend', period, branchId ?? 'global'] as const,
    revenueTrendAll: ['dashboard', 'revenue-trend'] as const,
    vehicleUtilization: ['dashboard', 'vehicle-utilization'] as const,
    recentActivity: ['dashboard', 'recent-activity'] as const,
    upcomingReturns: ['dashboard', 'upcoming-returns'] as const,
};

/* Queries */
export function useDashboardStats(branchId?: string | null) {
    return useQuery({
        queryKey: dashboardKeys.stats(branchId),
        queryFn: () => dashboardService.getStats(branchId),
        staleTime: 1000 * 60 * 5,
    });
}

export function useRevenueTrend(
    period?: string,
    enabled = true,
    branchId?: string | null
) {
    return useQuery({
        queryKey: dashboardKeys.revenueTrend(period, branchId),
        queryFn: () => dashboardService.getRevenueTrend(period, branchId),
        staleTime: 1000 * 60 * 10,
        enabled,
    });
}

export function useVehicleUtilization(enabled = true) {
    return useQuery({
        queryKey: dashboardKeys.vehicleUtilization,
        queryFn: () => dashboardService.getVehicleUtilization(),
        staleTime: 1000 * 60 * 10,
        enabled,
    });
}

export function useRecentActivity() {
    return useQuery({
        queryKey: dashboardKeys.recentActivity,
        queryFn: () => dashboardService.getRecentActivity(),
        staleTime: 1000 * 60 * 2,
    });
}

export function useUpcomingReturns() {
    return useQuery({
        queryKey: dashboardKeys.upcomingReturns,
        queryFn: () => dashboardService.getUpcomingReturns(),
        staleTime: 1000 * 60 * 2,
    });
}

/* Realtime (Reverb / Echo) */
export function useDashboardListener(): void {
    const queryClient = useQueryClient();

    const invalidateDashboard = () => {
        queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
        queryClient.invalidateQueries({
            queryKey: dashboardKeys.recentActivity,
        });
    };

    const invalidateDashboardAndRentals = () => {
        queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
        queryClient.invalidateQueries({
            queryKey: dashboardKeys.recentActivity,
        });
        queryClient.invalidateQueries({
            queryKey: dashboardKeys.upcomingReturns,
        });
        queryClient.invalidateQueries({ queryKey: ['rentals'] });
    };

    const invalidateDashboardRentalsAndTransactions = () => {
        queryClient.invalidateQueries({ queryKey: dashboardKeys.statsAll });
        queryClient.invalidateQueries({
            queryKey: dashboardKeys.recentActivity,
        });
        queryClient.invalidateQueries({
            queryKey: dashboardKeys.revenueTrendAll,
        });
        queryClient.invalidateQueries({
            queryKey: dashboardKeys.upcomingReturns,
        });
        queryClient.invalidateQueries({ queryKey: ['rentals'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
    };

    useEcho('dashboard', '.BookingCreated', invalidateDashboard, [queryClient]);
    useEcho('dashboard', '.RentalCreated', invalidateDashboard, [queryClient]);
    useEcho(
        'dashboard',
        '.RentalStatusChanged',
        invalidateDashboardAndRentals,
        [queryClient]
    );
    useEcho(
        'dashboard',
        '.RentalPickedUp',
        invalidateDashboardRentalsAndTransactions,
        [queryClient]
    );
    useEcho('dashboard', '.RentalReturned', invalidateDashboardAndRentals, [
        queryClient,
    ]);
    useEcho(
        'dashboard',
        '.RentalCompleted',
        invalidateDashboardRentalsAndTransactions,
        [queryClient]
    );
    useEcho('dashboard', '.RentalOverdue', invalidateDashboardAndRentals, [
        queryClient,
    ]);
    useEcho('dashboard', '.QuoteRequestSubmitted', invalidateDashboard, [
        queryClient,
    ]);
    useEcho(
        'dashboard',
        '.PaymentStatusUpdated',
        invalidateDashboardRentalsAndTransactions,
        [queryClient]
    );
}
