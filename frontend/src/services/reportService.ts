import { apiClient } from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import type {
    ReportFilters,
    RevenueReportResponse,
    VehiclesReportResponse,
    ManagerPerformanceResponse,
    OutstandingPaymentsResponse,
    MaintenanceReportResponse,
    CustomerAnalysisResponse,
    VehicleExpenseReportResponse,
} from '@/shared/types';

export const reportService = {
    async getRevenue(
        filters: ReportFilters = {}
    ): Promise<RevenueReportResponse> {
        return apiClient.get<RevenueReportResponse>(
            API_ENDPOINTS.REPORTS.REVENUE,
            {
                params: filters,
            }
        );
    },

    async getVehicles(
        filters: ReportFilters = {}
    ): Promise<VehiclesReportResponse> {
        return apiClient.get<VehiclesReportResponse>(
            API_ENDPOINTS.REPORTS.VEHICLES,
            {
                params: filters,
            }
        );
    },

    async getManagerPerformance(
        filters: ReportFilters = {}
    ): Promise<ManagerPerformanceResponse> {
        return apiClient.get<ManagerPerformanceResponse>(
            API_ENDPOINTS.REPORTS.MANAGER_PERFORMANCE,
            {
                params: filters,
            }
        );
    },

    async getOutstandingPayments(
        filters: ReportFilters = {}
    ): Promise<OutstandingPaymentsResponse> {
        return apiClient.get<OutstandingPaymentsResponse>(
            API_ENDPOINTS.REPORTS.OUTSTANDING_PAYMENTS,
            { params: filters }
        );
    },

    async getMaintenance(
        filters: ReportFilters = {}
    ): Promise<MaintenanceReportResponse> {
        return apiClient.get<MaintenanceReportResponse>(
            API_ENDPOINTS.REPORTS.MAINTENANCE,
            { params: filters }
        );
    },

    async getCustomerAnalysis(
        filters: ReportFilters = {}
    ): Promise<CustomerAnalysisResponse> {
        return apiClient.get<CustomerAnalysisResponse>(
            API_ENDPOINTS.REPORTS.CUSTOMER_ANALYSIS,
            {
                params: filters,
            }
        );
    },

    async getVehicleExpenses(
        filters: ReportFilters = {}
    ): Promise<VehicleExpenseReportResponse> {
        return apiClient.get<VehicleExpenseReportResponse>(
            API_ENDPOINTS.REPORTS.VEHICLE_EXPENSES,
            {
                params: filters,
            }
        );
    },

    async exportPdf(
        type: string,
        filters: ReportFilters = {}
    ): Promise<Blob | string> {
        const blob = await apiClient.get<Blob>(
            API_ENDPOINTS.REPORTS.EXPORT_PDF(type),
            {
                params: filters,
                responseType: 'blob',
            } as never
        );

        return URL.createObjectURL(blob);
    },
};
