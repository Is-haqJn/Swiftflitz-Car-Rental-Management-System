import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/reportService';
import type { ReportFilters } from '@/shared/types';

/* Query Keys */
export const reportKeys = {
    revenue: (filters: ReportFilters) =>
        ['reports', 'revenue', filters] as const,
    vehicles: (filters: ReportFilters) =>
        ['reports', 'vehicles', filters] as const,
    managerPerformance: (filters: ReportFilters) =>
        ['reports', 'manager-performance', filters] as const,
    outstandingPayments: (filters: ReportFilters) =>
        ['reports', 'outstanding-payments', filters] as const,
    maintenance: (filters: ReportFilters) =>
        ['reports', 'maintenance', filters] as const,
    vehicleExpenses: (filters: ReportFilters) =>
        ['reports', 'vehicle-expenses', filters] as const,
    customerAnalysis: (filters: ReportFilters) =>
        ['reports', 'customer-analysis', filters] as const,
};

/* Queries */
export function useRevenueReport(filters: ReportFilters = {}) {
    return useQuery({
        queryKey: reportKeys.revenue(filters),
        queryFn: () => reportService.getRevenue(filters),
        staleTime: 1000 * 60 * 5,
    });
}

export function useVehiclesReport(filters: ReportFilters = {}) {
    return useQuery({
        queryKey: reportKeys.vehicles(filters),
        queryFn: () => reportService.getVehicles(filters),
        staleTime: 1000 * 60 * 5,
    });
}

export function useManagerPerformanceReport(filters: ReportFilters = {}) {
    return useQuery({
        queryKey: reportKeys.managerPerformance(filters),
        queryFn: () => reportService.getManagerPerformance(filters),
        staleTime: 1000 * 60 * 5,
    });
}

export function useOutstandingPaymentsReport(filters: ReportFilters = {}) {
    return useQuery({
        queryKey: reportKeys.outstandingPayments(filters),
        queryFn: () => reportService.getOutstandingPayments(filters),
        staleTime: 1000 * 60 * 5,
    });
}

export function useMaintenanceReport(filters: ReportFilters = {}) {
    return useQuery({
        queryKey: reportKeys.maintenance(filters),
        queryFn: () => reportService.getMaintenance(filters),
        staleTime: 1000 * 60 * 5,
    });
}

export function useCustomerAnalysisReport(filters: ReportFilters = {}) {
    return useQuery({
        queryKey: reportKeys.customerAnalysis(filters),
        queryFn: () => reportService.getCustomerAnalysis(filters),
        staleTime: 1000 * 60 * 5,
    });
}

export function useVehicleExpenseReport(filters: ReportFilters = {}) {
    return useQuery({
        queryKey: reportKeys.vehicleExpenses(filters),
        queryFn: () => reportService.getVehicleExpenses(filters),
        staleTime: 1000 * 60 * 5,
    });
}
