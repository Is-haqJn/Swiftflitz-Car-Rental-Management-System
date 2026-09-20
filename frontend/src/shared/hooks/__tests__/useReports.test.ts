import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock reportService before importing hooks
vi.mock('@/services/reportService', () => ({
    reportService: {
        getRevenue: vi.fn().mockResolvedValue({ data: {} }),
        getVehicles: vi.fn().mockResolvedValue({ data: {} }),
        getManagerPerformance: vi.fn().mockResolvedValue({ data: {} }),
        getOutstandingPayments: vi.fn().mockResolvedValue({ data: {} }),
        getMaintenance: vi.fn().mockResolvedValue({ data: {} }),
        getCustomerAnalysis: vi.fn().mockResolvedValue({ data: {} }),
        getVehicleExpenses: vi.fn().mockResolvedValue({ data: {} }),
    },
}));

vi.mock('@tanstack/react-query', async importOriginal => {
    const original =
        await importOriginal<typeof import('@tanstack/react-query')>();
    return {
        ...original,
        useQuery: vi
            .fn()
            .mockReturnValue({ data: undefined, isLoading: false }),
    };
});

import { useQuery } from '@tanstack/react-query';
import {
    reportKeys,
    useRevenueReport,
    useVehiclesReport,
    useManagerPerformanceReport,
    useOutstandingPaymentsReport,
    useMaintenanceReport,
    useCustomerAnalysisReport,
    useVehicleExpenseReport,
} from '@/shared/hooks/queries/useReports';

const mockUseQuery = vi.mocked(useQuery);

beforeEach(() => {
    mockUseQuery.mockClear();
});

/* reportKeys */
describe('reportKeys', () => {
    it('generates stable revenue key from filters', () => {
        const filters = { start_date: '2026-01-01' };
        expect(reportKeys.revenue(filters)).toEqual([
            'reports',
            'revenue',
            filters,
        ]);
    });

    it('generates stable vehicles key from filters', () => {
        const filters = { start_date: '2026-01-01' };
        expect(reportKeys.vehicles(filters)).toEqual([
            'reports',
            'vehicles',
            filters,
        ]);
    });

    it('generates stable manager-performance key from filters', () => {
        const filters = { end_date: '2026-01-31' };
        expect(reportKeys.managerPerformance(filters)).toEqual([
            'reports',
            'manager-performance',
            filters,
        ]);
    });

    it('generates stable outstanding-payments key from filters', () => {
        const filters = { start_date: '2026-01-01' };
        expect(reportKeys.outstandingPayments(filters)).toEqual([
            'reports',
            'outstanding-payments',
            filters,
        ]);
    });

    it('generates stable maintenance key from filters', () => {
        const filters = { start_date: '2026-01-01' };
        expect(reportKeys.maintenance(filters)).toEqual([
            'reports',
            'maintenance',
            filters,
        ]);
    });

    it('generates stable customer-analysis key from filters', () => {
        const filters = { start_date: '2026-01-01' };
        expect(reportKeys.customerAnalysis(filters)).toEqual([
            'reports',
            'customer-analysis',
            filters,
        ]);
    });

    it('generates stable vehicle-expenses key from filters', () => {
        const filters = { start_date: '2026-01-01' };
        expect(reportKeys.vehicleExpenses(filters)).toEqual([
            'reports',
            'vehicle-expenses',
            filters,
        ]);
    });
});

/* useRevenueReport */
describe('useRevenueReport', () => {
    it('calls useQuery with the revenue query key', () => {
        const filters = { start_date: '2026-01-01' };
        renderHook(() => useRevenueReport(filters));
        expect(mockUseQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: reportKeys.revenue(filters),
            })
        );
    });

    it('uses empty filters by default', () => {
        renderHook(() => useRevenueReport());
        expect(mockUseQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: reportKeys.revenue({}),
            })
        );
    });

    it('includes chart_period in the revenue query key when provided', () => {
        const filters = { start_date: '2026-01-01', chart_period: 'weekly' };
        renderHook(() => useRevenueReport(filters));
        expect(mockUseQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: reportKeys.revenue(filters),
            })
        );
    });

    it('includes chart_period=monthly in query key when set to monthly', () => {
        const filters = { chart_period: 'monthly' };
        renderHook(() => useRevenueReport(filters));
        expect(mockUseQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: reportKeys.revenue(filters),
            })
        );
    });
});

/* useVehiclesReport */
describe('useVehiclesReport', () => {
    it('calls useQuery with the vehicles query key', () => {
        const filters = { start_date: '2026-02-01' };
        renderHook(() => useVehiclesReport(filters));
        expect(mockUseQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: reportKeys.vehicles(filters),
            })
        );
    });
});

/* useManagerPerformanceReport */
describe('useManagerPerformanceReport', () => {
    it('calls useQuery with the manager-performance query key', () => {
        const filters = { start_date: '2026-02-01', end_date: '2026-02-28' };
        renderHook(() => useManagerPerformanceReport(filters));
        expect(mockUseQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: reportKeys.managerPerformance(filters),
            })
        );
    });
});

/* useOutstandingPaymentsReport */
describe('useOutstandingPaymentsReport', () => {
    it('calls useQuery with the outstanding-payments key', () => {
        renderHook(() => useOutstandingPaymentsReport());
        expect(mockUseQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: reportKeys.outstandingPayments({}),
            })
        );
    });
});

/* useMaintenanceReport */
describe('useMaintenanceReport', () => {
    it('calls useQuery with the maintenance key', () => {
        renderHook(() => useMaintenanceReport());
        expect(mockUseQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: reportKeys.maintenance({}),
            })
        );
    });
});

/* useCustomerAnalysisReport */
describe('useCustomerAnalysisReport', () => {
    it('calls useQuery with the customer-analysis query key', () => {
        const filters = { start_date: '2026-01-01' };
        renderHook(() => useCustomerAnalysisReport(filters));
        expect(mockUseQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: reportKeys.customerAnalysis(filters),
            })
        );
    });
});

/* useVehicleExpenseReport */
describe('useVehicleExpenseReport', () => {
    it('calls useQuery with the vehicle-expenses query key', () => {
        const filters = { start_date: '2026-01-01' };
        renderHook(() => useVehicleExpenseReport(filters));
        expect(mockUseQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: reportKeys.vehicleExpenses(filters),
            })
        );
    });
});
