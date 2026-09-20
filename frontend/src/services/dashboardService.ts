import { apiClient } from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import type {
    DashboardStats,
    RevenueTrendPoint,
    VehicleUtilizationItem,
    RecentRental,
    RecentQuote,
    UpcomingReturn,
} from '@/shared/types';

export const dashboardService = {
    async getStats(
        branchId?: string | null
    ): Promise<{ data: DashboardStats }> {
        return apiClient.get<{ data: DashboardStats }>(
            API_ENDPOINTS.DASHBOARD.STATS,
            { params: branchId ? { branch_id: branchId } : {} }
        );
    },

    async getRevenueTrend(
        period?: string,
        branchId?: string | null
    ): Promise<{ data: RevenueTrendPoint[] }> {
        const params: Record<string, string> = {};
        if (period) params.period = period;
        if (branchId) params.branch_id = branchId;
        return apiClient.get<{ data: RevenueTrendPoint[] }>(
            API_ENDPOINTS.DASHBOARD.REVENUE_TREND,
            { params }
        );
    },

    async getVehicleUtilization(): Promise<{ data: VehicleUtilizationItem[] }> {
        return apiClient.get<{ data: VehicleUtilizationItem[] }>(
            API_ENDPOINTS.DASHBOARD.VEHICLE_UTILIZATION
        );
    },

    async getRecentActivity(): Promise<{
        data: { recent_rentals: RecentRental[]; recent_quotes: RecentQuote[] };
    }> {
        return apiClient.get<{
            data: {
                recent_rentals: RecentRental[];
                recent_quotes: RecentQuote[];
            };
        }>(API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITY);
    },

    async getUpcomingReturns(): Promise<{
        data: { due_today: UpcomingReturn[]; overdue: UpcomingReturn[] };
    }> {
        return apiClient.get<{
            data: { due_today: UpcomingReturn[]; overdue: UpcomingReturn[] };
        }>(API_ENDPOINTS.DASHBOARD.UPCOMING_RETURNS);
    },
};
