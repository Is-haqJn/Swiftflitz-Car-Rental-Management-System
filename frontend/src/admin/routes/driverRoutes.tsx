import { lazy } from 'react';
import { Route, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PERMISSIONS } from '@/shared/config/permissions';
import { ROUTES } from '@/shared/routes';

const AllDrivers = lazy(() => import('@adminPages/drivers/AllDrivers'));
const CreateDriver = lazy(() => import('@adminPages/drivers/CreateDriver'));
const DriverDetail = lazy(() => import('@adminPages/drivers/DriverDetail'));

export function DriverRoutes() {
    const navigate = useNavigate();

    return (
        <Route path="drivers">
            {/* All Drivers (index) */}
            <Route
                index
                element={
                    <ProtectedRoute permission={PERMISSIONS.DRIVERS.VIEW_ALL}>
                        <AllDrivers
                            onAdd={() =>
                                navigate(ROUTES.DASHBOARD.DRIVERS.CREATE)
                            }
                            onEdit={driver =>
                                navigate(
                                    ROUTES.DASHBOARD.DRIVERS.EDIT(driver.id)
                                )
                            }
                        />
                    </ProtectedRoute>
                }
            />

            {/* Create */}
            <Route
                path="create"
                element={
                    <ProtectedRoute permission={PERMISSIONS.DRIVERS.CREATE}>
                        <CreateDriver />
                    </ProtectedRoute>
                }
            />

            {/* Edit */}
            <Route
                path="edit/:id"
                element={
                    <ProtectedRoute permission={PERMISSIONS.DRIVERS.EDIT}>
                        <CreateDriver />
                    </ProtectedRoute>
                }
            />

            {/* Detail (wildcard - must be last) */}
            <Route
                path=":id"
                element={
                    <ProtectedRoute permission={PERMISSIONS.DRIVERS.VIEW_ALL}>
                        <DriverDetail />
                    </ProtectedRoute>
                }
            />
        </Route>
    );
}
