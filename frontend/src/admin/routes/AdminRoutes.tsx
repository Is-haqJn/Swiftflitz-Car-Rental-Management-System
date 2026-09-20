import { lazy, Suspense } from 'react';
import DashboardLayout from '@adminLayouts/DashboardLayout';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PERMISSIONS } from '@/shared/config/permissions';
import { AppBootSkeleton } from '@adminComponents/skeletons/AppBootSkeleton';

import { UserRoutes } from './userRoutes';
import { VehicleRoutes } from './vehicleRoutes';
import { CustomerRoutes } from './customerRoutes';
import { NotificationRoutes } from './notificationRoutes';
import { ReportRoutes } from './reportRoutes';
import { SettingsRoutes } from './settingsRoutes';
import { BranchRoutes } from './branchRoutes';
import { RentalsRoutes } from './rentalsRoutes';
import { DiscountRoutes } from './discountRoutes';
import { CouponRoutes } from './couponRoutes';
import { DriverRoutes } from './driverRoutes';
import { FleetVehicleRoutes } from './fleetVehicleRoutes';
import { AirportTransferRoutes } from './airportTransferRoutes';
import { ChauffeurRentalRoutes } from './chauffeurRentalRoutes';
import { FinanceRoutes } from './financeRoutes';

const Dashboard = lazy(() => import('@adminPages/dashboard/Dashboard'));
const Profile = lazy(() => import('@adminPages/profile/Profile'));
const NotificationPreferences = lazy(() => import('@adminPages/profile/NotificationPreferences'));
const AllExports = lazy(() => import('@adminPages/exports/AllExports'));

export const AdminRoutes = () => {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <Suspense fallback={<AppBootSkeleton />}>
                    <Routes>
                        {/* Dashboard */}
                        <Route
                            path="dashboard"
                            index
                            element={
                                <ProtectedRoute
                                    permission={PERMISSIONS.DASHBOARD.VIEW}
                                >
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Profile */}
                        <Route path="profile" element={<Profile />} />
                        <Route
                            path="profile/notification-preferences"
                            element={<NotificationPreferences />}
                        />

                        {/* Exports */}
                        <Route path="exports">
                            <Route index element={<AllExports />} />
                        </Route>

                        {/* Domain Route Modules */}
                        {UserRoutes()}
                        {VehicleRoutes()}
                        {CustomerRoutes()}
                        {NotificationRoutes()}
                        {ReportRoutes()}
                        {SettingsRoutes()}
                        {BranchRoutes()}
                        {RentalsRoutes()}
                        {DiscountRoutes()}
                        {CouponRoutes()}
                        {DriverRoutes()}
                        {FleetVehicleRoutes()}
                        {AirportTransferRoutes()}
                        {ChauffeurRentalRoutes()}
                        {FinanceRoutes()}

                        {/* Fallback 404 */}
                        <Route path="*" element={<Navigate to="/404" replace />} />
                    </Routes>
                </Suspense>
            </DashboardLayout>
        </ProtectedRoute>
    );
};
