import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { PERMISSIONS } from '@/shared/config/permissions';
import { ProtectedRoute } from './ProtectedRoute';

const RevenueReport = lazy(() => import('@adminPages/reports/RevenueReport'));
const VehiclesReport = lazy(() => import('@adminPages/reports/VehiclesReport'));
const ManagerPerformanceReport = lazy(() => import('@adminPages/reports/ManagerPerformanceReport'));
const OutstandingPaymentsReport = lazy(() => import('@adminPages/reports/OutstandingPaymentsReport'));
const MaintenanceReport = lazy(() => import('@adminPages/reports/MaintenanceReport'));
const CustomerAnalysisReport = lazy(() => import('@adminPages/reports/CustomerAnalysisReport'));
const VehicleExpenseReport = lazy(() => import('@adminPages/reports/VehicleExpenseReport'));

export function ReportRoutes() {
    return (
        <Route path="reports">
            <Route
                path="revenue"
                element={
                    <ProtectedRoute
                        permission={PERMISSIONS.REPORTS.VIEW_REVENUE}
                    >
                        <RevenueReport />
                    </ProtectedRoute>
                }
            />
            <Route
                path="vehicles"
                element={
                    <ProtectedRoute
                        permission={PERMISSIONS.REPORTS.VIEW_UTILIZATION}
                    >
                        <VehiclesReport />
                    </ProtectedRoute>
                }
            />
            <Route
                path="manager-performance"
                element={
                    <ProtectedRoute
                        permission={
                            PERMISSIONS.REPORTS.VIEW_MANAGER_PERFORMANCE
                        }
                    >
                        <ManagerPerformanceReport />
                    </ProtectedRoute>
                }
            />
            <Route
                path="outstanding-payments"
                element={
                    <ProtectedRoute
                        permission={
                            PERMISSIONS.REPORTS.VIEW_OUTSTANDING_PAYMENTS
                        }
                    >
                        <OutstandingPaymentsReport />
                    </ProtectedRoute>
                }
            />
            <Route
                path="maintenance-repairs"
                element={
                    <ProtectedRoute
                        permission={PERMISSIONS.REPORTS.VIEW_MAINTENANCE}
                    >
                        <MaintenanceReport />
                    </ProtectedRoute>
                }
            />
            <Route
                path="customer-analysis"
                element={
                    <ProtectedRoute
                        permission={PERMISSIONS.REPORTS.VIEW_CUSTOMER_ANALYTICS}
                    >
                        <CustomerAnalysisReport />
                    </ProtectedRoute>
                }
            />
            <Route
                path="vehicle-expenses"
                element={
                    <ProtectedRoute
                        permission={PERMISSIONS.REPORTS.VIEW_UTILIZATION}
                    >
                        <VehicleExpenseReport />
                    </ProtectedRoute>
                }
            />
        </Route>
    );
}
